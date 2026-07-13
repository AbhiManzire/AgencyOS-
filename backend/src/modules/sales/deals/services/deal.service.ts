import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProjectServiceType, type DealStage, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { WorkflowEventDispatcher } from '../../../automation/services/workflow-event-dispatcher.service';
import { ClientService } from '../../../clients/services/client.service';
import { ClientConversionService } from '../../../clients/success/services/client-conversion.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { SalesNotificationEmitter } from '../../../notifications/events/sales-notification.emitter';
import { NOTIFICATION_EVENT_KEYS } from '../../../notifications/events/notification-event.catalog';
import type { ProjectScope } from '../../../projects/repositories/project.repository.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeadService } from '../../leads/services/lead.service';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
  type LeadScope,
} from '../../leads/repositories/lead.repository.interface';
import { SalesPipelineService } from '../../pipelines/services/sales-pipeline.service';
import { DealDomainService } from '../domain/deal-domain.service';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from '../domain/deal-domain.errors';
import {
  DEAL_REPOSITORY,
  type ArchiveDealData,
  type CreateDealData,
  type DealRepository,
  type DealScope,
  type DealTransactionClient,
  type FindDealByIdOptions,
  type UpdateDealData,
} from '../repositories/deal.repository.interface';
import type {
  ConvertDealToInvoiceCommand,
  ConvertedInvoiceRecord,
  CreateDealCommand,
  CreateDealFromLeadCommand,
  DealApplicationContext,
  DealDashboardResult,
  DealForecastResult,
  DealRecord,
  GetDealForecastQuery,
  GetDealOptions,
  ListDealsQuery,
  ListDealsResult,
  LoseDealCommand,
  UpdateDealCommand,
  UpdateDealStageCommand,
  WinDealCommand,
} from './deal-application.types';

@Injectable()
export class DealService {
  private readonly logger = new Logger(DealService.name);

  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepository: LeadRepository,
    private readonly dealDomainService: DealDomainService,
    private readonly activityService: ActivityService,
    private readonly projectService: ProjectService,
    private readonly salesPipelineService: SalesPipelineService,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
    private readonly clientService: ClientService,
    private readonly clientConversionService: ClientConversionService,
    private readonly leadService: LeadService,
    private readonly workflowEventDispatcher: WorkflowEventDispatcher,
    private readonly prisma: PrismaService,
  ) {}

  async createDeal(
    scope: DealScope,
    command: CreateDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const clientScope = toClientScope(scope);

    this.dealDomainService.validateCreate({
      title: command.title,
      value: command.value,
      stage: command.stage,
      probability: command.probability,
      priority: command.priority,
    });

    await this.dealDomainService.validateClient(clientScope, command.clientId);

    if (command.contactId !== undefined && command.contactId !== null) {
      await this.dealDomainService.validateContact(
        clientScope,
        command.clientId,
        command.contactId,
      );
    }

    const pipeline = await this.salesPipelineService.ensureDefaultPipeline(
      scope,
      context.actorUserId,
    );
    const stage = command.stage ?? 'QUALIFICATION';
    const pipelineStage =
      pipeline.stages.find((item) => item.stageKey === stage) ??
      pipeline.stages.find((item) => item.stageKey === 'QUALIFICATION') ??
      null;

    const now = new Date();
    const dealId = randomUUID();
    const probability =
      command.probability ??
      pipelineStage?.probability ??
      this.dealDomainService.defaultProbability(stage);
    const forecastCategory =
      command.forecastCategory ?? this.dealDomainService.defaultForecastCategory(stage);
    const status = this.dealDomainService.deriveStatus(stage);

    const data: CreateDealData = {
      id: dealId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      contactId: command.contactId ?? null,
      leadId: command.leadId ?? null,
      pipelineId: pipeline.id,
      pipelineStageId: pipelineStage?.id ?? null,
      title: this.dealDomainService.normalizeTitle(command.title),
      description: normalizeOptionalString(command.description),
      value: command.value,
      currency: command.currency ?? 'USD',
      expectedCloseDate: command.expectedCloseDate ?? null,
      ownerUserId: command.ownerUserId ?? null,
      stage,
      status,
      source: command.source ?? null,
      forecastCategory,
      service: normalizeOptionalString(command.service),
      probability,
      priority: command.priority ?? 'MEDIUM',
      stageEnteredAt: now,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    const created = await this.runInTransaction(async (tx) => {
      const createdDeal = await this.dealRepository.create(data, tx);

      await this.dealRepository.createStageHistory(
        {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          dealId: createdDeal.id,
          fromStage: stage,
          toStage: stage,
          enteredAt: now,
          changedByUserId: context.actorUserId,
        },
        tx,
      );

      await this.emitActivity(
        scope,
        createdDeal.id,
        'CUSTOM',
        'Deal Created',
        context,
        undefined,
        'Deal was created.',
        `deal.created:${createdDeal.id}`,
      );

      if (createdDeal.ownerUserId !== null) {
        await this.emitActivity(
          scope,
          createdDeal.id,
          'OWNER_CHANGED',
          'Deal Assigned',
          context,
          { ownerUserId: createdDeal.ownerUserId },
          'Deal owner was assigned.',
          `deal.assigned:${createdDeal.id}:${createdDeal.ownerUserId}`,
        );

        await this.emitDealNotification(
          scope,
          createdDeal.ownerUserId,
          NOTIFICATION_EVENT_KEYS.DEAL_OWNER_CHANGED,
          { title: createdDeal.title },
          createdDeal.id,
        );
      }

      return createdDeal;
    });

    this.emitWorkflowEvent(scope, 'DEAL_CREATED', created, context.actorUserId);
    return created;
  }

  async updateDeal(
    scope: DealScope,
    dealId: string,
    command: UpdateDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId, { includeArchived: true });
    const clientScope = toClientScope(scope);
    const nextClientId = command.clientId ?? existing.clientId;

    this.dealDomainService.validateUpdate(existing, {
      title: command.title,
      value: command.value,
      stage: command.stage,
      probability: command.probability,
      priority: command.priority,
    });

    if (command.clientId !== undefined) {
      await this.dealDomainService.validateClient(clientScope, command.clientId);
    }

    if (command.contactId !== undefined && command.contactId !== null) {
      await this.dealDomainService.validateContact(clientScope, nextClientId, command.contactId);
    }

    const now = new Date();
    const stageChanged = command.stage !== undefined && command.stage !== existing.stage;
    const ownerChanged =
      command.ownerUserId !== undefined && command.ownerUserId !== existing.ownerUserId;
    const nextStage = command.stage ?? existing.stage;

    let pipelineId = existing.pipelineId;
    let pipelineStageId = existing.pipelineStageId;
    let probability = command.probability;
    let forecastCategory = command.forecastCategory;
    let status = existing.status;

    if (stageChanged) {
      const synced = await this.resolvePipelineStageRefs(scope, nextStage, existing.pipelineId);
      pipelineId = synced.pipelineId;
      pipelineStageId = synced.pipelineStageId;
      if (probability === undefined) {
        probability = synced.probability;
      }
      forecastCategory ??= this.dealDomainService.defaultForecastCategory(nextStage);
      status = this.dealDomainService.deriveStatus(nextStage);
    }

    const data: UpdateDealData = {
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.contactId !== undefined ? { contactId: command.contactId } : {}),
      ...(command.leadId !== undefined ? { leadId: command.leadId } : {}),
      ...(command.title !== undefined
        ? { title: this.dealDomainService.normalizeTitle(command.title) }
        : {}),
      ...(command.description !== undefined
        ? { description: normalizeOptionalString(command.description) }
        : {}),
      ...(command.value !== undefined ? { value: command.value } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.expectedCloseDate !== undefined
        ? { expectedCloseDate: command.expectedCloseDate }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.stage !== undefined ? { stage: command.stage } : {}),
      ...(stageChanged
        ? {
            pipelineId,
            pipelineStageId,
            status,
            ...(probability !== undefined ? { probability } : {}),
            ...(forecastCategory !== undefined ? { forecastCategory } : {}),
          }
        : {
            ...(command.forecastCategory !== undefined
              ? { forecastCategory: command.forecastCategory }
              : {}),
            ...(command.probability !== undefined ? { probability: command.probability } : {}),
          }),
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.service !== undefined
        ? { service: normalizeOptionalString(command.service) }
        : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.lossReason !== undefined
        ? { lossReason: normalizeOptionalString(command.lossReason) }
        : {}),
      ...(command.competitor !== undefined
        ? { competitor: normalizeOptionalString(command.competitor) }
        : {}),
      ...(command.lossNotes !== undefined
        ? { lossNotes: normalizeOptionalString(command.lossNotes) }
        : {}),
      ...(stageChanged ? { stageEnteredAt: now } : {}),
      ...(stageChanged && nextStage === 'WON' && existing.wonAt === null ? { wonAt: now } : {}),
      ...(stageChanged && nextStage === 'LOST' && existing.lostAt === null ? { lostAt: now } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      if (stageChanged) {
        await this.dealRepository.closeOpenStageHistory(scope, dealId, now, tx);
      }

      const updated = await this.dealRepository.update(scope, dealId, data, tx);

      if (updated === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      if (stageChanged) {
        await this.recordStageChange(scope, existing, updated, context, now, tx);
      }

      if (ownerChanged && updated.ownerUserId !== null) {
        await this.emitActivity(
          scope,
          updated.id,
          'OWNER_CHANGED',
          'Deal Assigned',
          context,
          { ownerUserId: updated.ownerUserId },
          'Deal owner was updated.',
          `deal.assigned:${updated.id}:${updated.ownerUserId}`,
        );

        await this.emitDealNotification(
          scope,
          updated.ownerUserId,
          NOTIFICATION_EVENT_KEYS.DEAL_OWNER_CHANGED,
          { title: updated.title },
          updated.id,
        );
      }

      if (!stageChanged && !ownerChanged) {
        await this.emitActivity(
          scope,
          updated.id,
          'CUSTOM',
          'Deal Updated',
          context,
          undefined,
          'Deal details were updated.',
          `deal.updated:${updated.id}:${now.toISOString()}`,
        );
      }

      return updated;
    });
  }

  async updateStage(
    scope: DealScope,
    dealId: string,
    command: UpdateDealStageCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId);
    this.dealDomainService.validateStageChange(existing, command.stage);

    if (existing.stage === command.stage) {
      return existing;
    }

    const updated = await this.applyStageChange(scope, existing, command.stage, context, {});
    this.emitWorkflowEvent(scope, 'DEAL_STAGE_CHANGED', updated, context.actorUserId, {
      fromStage: existing.stage,
      toStage: updated.stage,
    });
    return updated;
  }

  async winDeal(
    scope: DealScope,
    dealId: string,
    command: WinDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId);
    this.dealDomainService.validateWin(existing, command);

    let deal =
      existing.stage === 'WON'
        ? existing
        : await this.applyStageChange(scope, existing, 'WON', context, {});

    if (command.convertClient && deal.leadId !== null) {
      const lead = await this.leadRepository.findById(toLeadScope(scope), deal.leadId);
      if (lead !== null && lead.convertedClientId === null && lead.status !== 'CONVERTED') {
        await this.leadService.convertLead(toLeadScope(scope), deal.leadId, context);
      }
    }

    if (command.createProject && deal.convertedProjectId === null) {
      deal = await this.convertToProject(scope, deal.id, context, {
        projectName: command.projectName,
        templateId: command.templateId,
      });
    }

    if (command.createInvoice) {
      await this.convertToInvoice(
        scope,
        deal.id,
        {
          projectId: command.projectId ?? deal.convertedProjectId,
          quoteId: command.quoteId,
          issueDate: command.issueDate,
          dueDate: command.dueDate,
          notes: command.notes,
        },
        context,
      );
      deal = await this.requireDeal(scope, deal.id, { includeArchived: true });
    }

    await this.clientConversionService.activateClientFromWonDeal(
      toClientScope(scope),
      deal.id,
      deal.clientId,
      { actorUserId: context.actorUserId },
    );

    this.emitWorkflowEvent(scope, 'DEAL_WON', deal, context.actorUserId);
    return deal;
  }

  async loseDeal(
    scope: DealScope,
    dealId: string,
    command: LoseDealCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId);
    this.dealDomainService.validateLose(existing, { lossReason: command.lossReason });

    const lost = await this.applyStageChange(scope, existing, 'LOST', context, {
      lossReason: command.lossReason.trim(),
      competitor: normalizeOptionalString(command.competitor),
      lossNotes: normalizeOptionalString(command.lossNotes),
    });
    this.emitWorkflowEvent(scope, 'DEAL_LOST', lost, context.actorUserId, {
      lossReason: command.lossReason.trim(),
    });
    return lost;
  }

  async createDealFromLead(
    scope: DealScope,
    leadId: string,
    command: CreateDealFromLeadCommand,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const lead = await this.leadRepository.findById(toLeadScope(scope), leadId);
    if (lead === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
    }

    if (lead.status !== 'QUALIFIED' && lead.status !== 'CONTACTED') {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.LEAD_NOT_ELIGIBLE,
        'Lead must be CONTACTED or QUALIFIED to create a deal.',
      );
    }

    let clientId = command.clientId ?? lead.convertedClientId;
    if (clientId === null) {
      const client = await this.clientService.createClient(
        toClientScope(scope),
        {
          displayName: lead.company,
          email: lead.email,
          phone: lead.phone,
          website: lead.website,
          industry: lead.industry,
          source: 'SALES_CONVERSION',
          status: 'PROSPECT',
          ownerUserId: lead.assignedToUserId,
        },
        { actorUserId: context.actorUserId },
      );
      clientId = client.id;
    }

    return this.createDeal(
      scope,
      {
        clientId,
        contactId: command.contactId ?? null,
        leadId: lead.id,
        title: command.title ?? `${lead.company} Deal`,
        description: command.description ?? lead.notes,
        value: command.value ?? lead.expectedDealSize ?? 0,
        currency: command.currency ?? 'USD',
        expectedCloseDate: command.expectedCloseDate ?? null,
        ownerUserId: command.ownerUserId ?? lead.assignedToUserId,
        stage: command.stage ?? 'QUALIFICATION',
        source: lead.source,
        forecastCategory: command.forecastCategory,
        service: command.service ?? null,
        probability: command.probability,
        priority: command.priority ?? lead.priority,
      },
      context,
    );
  }

  async getForecast(scope: DealScope, query: GetDealForecastQuery): Promise<DealForecastResult> {
    const asOf = query.asOf ?? new Date();
    const { periodStart, periodEnd } = resolveForecastPeriod(query.period, asOf);
    const aggregate = await this.dealRepository.getForecastAggregate(scope, {
      periodStart,
      periodEnd,
    });

    return {
      ...aggregate,
      period: query.period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    };
  }

  async getDashboard(scope: DealScope): Promise<DealDashboardResult> {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
    return this.dealRepository.getDashboardAggregate(scope, monthStart, monthEnd);
  }

  async archiveDeal(
    scope: DealScope,
    dealId: string,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.requireDeal(scope, dealId);
    this.dealDomainService.validateArchive(existing);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      await this.dealRepository.closeOpenStageHistory(scope, dealId, now, tx);

      const archived = await this.dealRepository.archive(
        scope,
        dealId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        } satisfies ArchiveDealData,
        tx,
      );

      if (archived === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      await this.dealRepository.createStageHistory(
        {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          dealId,
          fromStage: existing.stage,
          toStage: 'ARCHIVED',
          enteredAt: now,
          changedByUserId: context.actorUserId,
        },
        tx,
      );

      await this.emitActivity(
        scope,
        archived.id,
        'CUSTOM',
        'Archived',
        context,
        undefined,
        'Deal was archived.',
        `deal.archived:${archived.id}`,
      );

      return archived;
    });
  }

  async restoreDeal(
    scope: DealScope,
    dealId: string,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const existing = await this.dealRepository.findById(scope, dealId, { includeArchived: true });

    if (existing === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    this.dealDomainService.validateRestore(existing);

    const pipeline = await this.salesPipelineService.ensureDefaultPipeline(
      scope,
      context.actorUserId,
    );
    const qualificationStage =
      pipeline.stages.find((item) => item.stageKey === 'QUALIFICATION') ?? null;
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const restored = await this.dealRepository.restore(
        scope,
        dealId,
        {
          stage: 'QUALIFICATION',
          status: 'OPEN',
          forecastCategory: 'PIPELINE',
          probability: qualificationStage?.probability ?? 10,
          pipelineId: pipeline.id,
          pipelineStageId: qualificationStage?.id ?? null,
          stageEnteredAt: now,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (restored === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      await this.dealRepository.createStageHistory(
        {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          dealId,
          fromStage: 'ARCHIVED',
          toStage: 'QUALIFICATION',
          enteredAt: now,
          changedByUserId: context.actorUserId,
        },
        tx,
      );

      await this.emitActivity(
        scope,
        restored.id,
        'CUSTOM',
        'Restored',
        context,
        undefined,
        'Deal was restored.',
        `deal.restored:${restored.id}`,
      );

      return restored;
    });
  }

  async convertToProject(
    scope: DealScope,
    dealId: string,
    context: DealApplicationContext,
    options?: { projectName?: string | null; templateId?: string | null },
  ): Promise<DealRecord> {
    const deal = await this.requireDeal(scope, dealId, { includeArchived: true });
    this.dealDomainService.validateConvertToProject(deal);

    const projectScope: ProjectScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
    };

    const projectName = options?.projectName;
    const templateId = options?.templateId;
    const trimmedProjectName = projectName?.trim();

    const project = await this.projectService.createProject(
      projectScope,
      {
        clientId: deal.clientId,
        name:
          trimmedProjectName !== undefined && trimmedProjectName.length > 0
            ? trimmedProjectName
            : deal.title,
        projectManagerUserId: deal.ownerUserId ?? context.actorUserId,
        budgetAmount: deal.value,
        status: 'PLANNING',
        dealId: deal.id,
        primaryContactId: deal.contactId,
        templateId: templateId ?? null,
        serviceType: mapDealServiceToProjectServiceType(deal.service),
        serviceLabel: deal.service,
      },
      { actorUserId: context.actorUserId },
    );

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.dealRepository.update(
        scope,
        dealId,
        {
          convertedProjectId: project.id,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (updated === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      await this.emitActivity(
        scope,
        updated.id,
        'PROJECT_CREATED',
        'Converted to Project',
        context,
        { projectId: project.id },
        `Deal was converted to project "${project.name}".`,
        `deal.converted_to_project:${updated.id}:${project.id}`,
      );

      return updated;
    });
  }

  async convertToInvoice(
    scope: DealScope,
    dealId: string,
    command: ConvertDealToInvoiceCommand,
    context: DealApplicationContext,
  ): Promise<ConvertedInvoiceRecord> {
    const deal = await this.requireDeal(scope, dealId, { includeArchived: true });

    this.dealDomainService.validateConvertToInvoice(deal, { projectId: command.projectId });

    const projectId = command.projectId ?? deal.convertedProjectId;
    if (projectId === null) {
      throw new DealDomainError(
        DEAL_DOMAIN_ERROR_CODES.PROJECT_REQUIRED,
        'A project is required to convert this deal to an invoice.',
      );
    }

    const now = new Date();
    const issueDate = command.issueDate ?? now;
    const dueDate = command.dueDate ?? issueDate;
    const invoiceNumber = await this.generateUniqueInvoiceNumber(scope);

    return this.runInTransaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          clientId: deal.clientId,
          projectId,
          quoteId: command.quoteId ?? null,
          dealId: deal.id,
          invoiceNumber,
          status: 'DRAFT',
          issueDate,
          dueDate,
          currency: deal.currency,
          notes: normalizeOptionalString(command.notes),
          createdAt: now,
          updatedAt: now,
          createdByUserId: context.actorUserId,
          updatedByUserId: context.actorUserId,
        },
      });

      if (command.quoteId !== undefined && command.quoteId !== null) {
        await this.copyQuoteLineItemsToInvoice(
          tx,
          scope,
          command.quoteId,
          invoice.id,
          context.actorUserId,
          now,
        );
      }

      await this.emitActivity(
        scope,
        deal.id,
        'INVOICE_SENT',
        'Converted to Invoice',
        context,
        { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
        `Deal was converted to invoice ${invoice.invoiceNumber}.`,
        `deal.converted_to_invoice:${deal.id}:${invoice.id}`,
      );

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        clientId: invoice.clientId,
        projectId: invoice.projectId,
        quoteId: invoice.quoteId,
        dealId: invoice.dealId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
      };
    });
  }

  async getDeal(
    scope: DealScope,
    dealId: string,
    options: GetDealOptions = {},
  ): Promise<DealRecord> {
    const deal = await this.dealRepository.findById(scope, dealId, {
      includeArchived: options.includeArchived,
    });

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    this.dealDomainService.ensureWorkspaceOwnership(scope, deal);
    return deal;
  }

  async listDeals(scope: DealScope, query: ListDealsQuery = {}): Promise<ListDealsResult> {
    return this.dealRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      q: query.q,
      stage: query.stage,
      status: query.status,
      priority: query.priority,
      ownerUserId: query.ownerUserId,
      clientId: query.clientId,
      leadId: query.leadId,
      probabilityMin: query.probabilityMin,
      probabilityMax: query.probabilityMax,
      includeArchived: query.includeArchived,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  private async applyStageChange(
    scope: DealScope,
    existing: DealRecord,
    stage: DealStage,
    context: DealApplicationContext,
    extras: {
      lossReason?: string | null;
      competitor?: string | null;
      lossNotes?: string | null;
    },
  ): Promise<DealRecord> {
    const now = new Date();
    const synced = await this.resolvePipelineStageRefs(scope, stage, existing.pipelineId);
    const status = this.dealDomainService.deriveStatus(stage);
    const forecastCategory = this.dealDomainService.defaultForecastCategory(stage);

    return this.runInTransaction(async (tx) => {
      await this.dealRepository.closeOpenStageHistory(scope, existing.id, now, tx);

      const updated = await this.dealRepository.update(
        scope,
        existing.id,
        {
          stage,
          status,
          pipelineId: synced.pipelineId,
          pipelineStageId: synced.pipelineStageId,
          probability: synced.probability,
          forecastCategory,
          stageEnteredAt: now,
          ...(stage === 'WON' && existing.wonAt === null ? { wonAt: now } : {}),
          ...(stage === 'LOST' && existing.lostAt === null ? { lostAt: now } : {}),
          ...(extras.lossReason !== undefined ? { lossReason: extras.lossReason } : {}),
          ...(extras.competitor !== undefined ? { competitor: extras.competitor } : {}),
          ...(extras.lossNotes !== undefined ? { lossNotes: extras.lossNotes } : {}),
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (updated === null) {
        throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
      }

      await this.recordStageChange(scope, existing, updated, context, now, tx);
      return updated;
    });
  }

  private async recordStageChange(
    scope: DealScope,
    existing: DealRecord,
    updated: DealRecord,
    context: DealApplicationContext,
    now: Date,
    tx: DealTransactionClient,
  ): Promise<void> {
    await this.dealRepository.createStageHistory(
      {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dealId: updated.id,
        fromStage: existing.stage,
        toStage: updated.stage,
        enteredAt: now,
        changedByUserId: context.actorUserId,
      },
      tx,
    );

    await this.emitActivity(
      scope,
      updated.id,
      'PIPELINE_CHANGED',
      'Stage Changed',
      context,
      { from: existing.stage, to: updated.stage },
      `Stage changed from ${existing.stage} to ${updated.stage}.`,
      `deal.stage_changed:${updated.id}:${existing.stage}:${updated.stage}`,
    );

    if (updated.ownerUserId !== null) {
      await this.emitDealNotification(
        scope,
        updated.ownerUserId,
        NOTIFICATION_EVENT_KEYS.DEAL_STAGE_CHANGED,
        { title: updated.title, from: existing.stage, to: updated.stage },
        updated.id,
      );
    }

    if (updated.stage === 'WON') {
      await this.emitActivity(
        scope,
        updated.id,
        'DEAL_WON',
        'Deal Won',
        context,
        undefined,
        'Deal was marked as won.',
        `deal.won:${updated.id}`,
      );

      if (updated.ownerUserId !== null) {
        await this.emitDealNotification(
          scope,
          updated.ownerUserId,
          NOTIFICATION_EVENT_KEYS.DEAL_WON,
          { title: updated.title },
          updated.id,
        );
      }
    }

    if (updated.stage === 'LOST') {
      await this.emitActivity(
        scope,
        updated.id,
        'DEAL_LOST',
        'Deal Lost',
        context,
        undefined,
        'Deal was marked as lost.',
        `deal.lost:${updated.id}`,
      );

      if (updated.ownerUserId !== null) {
        await this.emitDealNotification(
          scope,
          updated.ownerUserId,
          NOTIFICATION_EVENT_KEYS.DEAL_LOST,
          { title: updated.title },
          updated.id,
        );
      }
    }

    if (updated.stage === 'PROPOSAL' && updated.ownerUserId !== null) {
      await this.emitDealNotification(
        scope,
        updated.ownerUserId,
        NOTIFICATION_EVENT_KEYS.PROPOSAL_PENDING,
        { title: updated.title },
        updated.id,
      );
    }
  }

  private async resolvePipelineStageRefs(
    scope: DealScope,
    stage: DealStage,
    existingPipelineId: string | null,
  ): Promise<{
    pipelineId: string | null;
    pipelineStageId: string | null;
    probability: number;
  }> {
    const pipeline = await this.salesPipelineService.ensureDefaultPipeline(scope, null);
    const pipelineRecord =
      existingPipelineId !== null && existingPipelineId !== pipeline.id
        ? ((await this.prisma.salesPipeline.findFirst({
            where: {
              id: existingPipelineId,
              tenantId: scope.tenantId,
              workspaceId: scope.workspaceId,
              deletedAt: null,
            },
            include: { stages: { where: { deletedAt: null } } },
          })) ?? pipeline)
        : pipeline;

    interface StageRef {
      stageKey: DealStage;
      id: string;
      probability: number;
    }
    const rawStages: unknown =
      'stages' in pipelineRecord && Array.isArray(pipelineRecord.stages)
        ? pipelineRecord.stages
        : pipeline.stages;
    const stages: StageRef[] = Array.isArray(rawStages)
      ? rawStages.filter((item): item is StageRef => {
          if (typeof item !== 'object' || item === null) {
            return false;
          }
          const record = item as Record<string, unknown>;
          return (
            typeof record.id === 'string' &&
            typeof record.probability === 'number' &&
            typeof record.stageKey === 'string'
          );
        })
      : [];

    const match = stages.find((item) => item.stageKey === stage);

    return {
      pipelineId: pipelineRecord.id,
      pipelineStageId: match?.id ?? null,
      probability: match?.probability ?? this.dealDomainService.defaultProbability(stage),
    };
  }

  private emitWorkflowEvent(
    scope: DealScope,
    triggerType: string,
    deal: DealRecord,
    actorUserId?: string | null,
    extra?: Record<string, unknown>,
  ): void {
    void this.workflowEventDispatcher
      .dispatch({
        scope: { tenantId: scope.tenantId, workspaceId: scope.workspaceId },
        triggerType,
        entityType: 'deal',
        entityId: deal.id,
        actorUserId: actorUserId ?? undefined,
        payload: {
          entityType: 'deal',
          entityId: deal.id,
          id: deal.id,
          stage: deal.stage,
          status: deal.status,
          ownerUserId: deal.ownerUserId,
          clientId: deal.clientId,
          value: deal.value,
          ...(extra ?? {}),
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Workflow emit ${triggerType} failed for deal ${deal.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private async emitDealNotification(
    scope: DealScope,
    recipientUserId: string,
    eventKey: string,
    vars: Readonly<Record<string, string | number | null | undefined>>,
    dealId: string,
  ): Promise<void> {
    try {
      await this.salesNotificationEmitter.emit(eventKey, scope, recipientUserId, vars, {
        entityType: 'Deal',
        entityId: dealId,
        linkPath: `/sales/deals/${dealId}`,
      });
    } catch {
      // Notification failures must not block deal mutations.
    }
  }

  private async copyQuoteLineItemsToInvoice(
    tx: DealTransactionClient,
    scope: DealScope,
    quoteId: string,
    invoiceId: string,
    actorUserId: string,
    now: Date,
  ): Promise<void> {
    const lineItems = await tx.quoteLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        quoteId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (lineItems.length === 0) {
      return;
    }

    await tx.invoiceLineItem.createMany({
      data: lineItems.map((item) => ({
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        invoiceId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
        sortOrder: item.sortOrder,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      })),
    });
  }

  private async generateUniqueInvoiceNumber(scope: DealScope): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `INV-${Date.now().toString(36).toUpperCase()}${attempt.toString(36).toUpperCase()}`;
      const existing = await this.prisma.invoice.findFirst({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          invoiceNumber: candidate,
        },
      });

      if (existing === null) {
        return candidate;
      }
    }

    return `INV-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async runInTransaction<T>(work: (tx: DealTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async emitActivity(
    scope: DealScope,
    dealId: string,
    type: string,
    title: string,
    context: DealApplicationContext,
    metadata?: Prisma.InputJsonValue,
    description?: string,
    dedupeKey?: string,
  ): Promise<void> {
    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'deal',
        entityId: dealId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
        ...(dedupeKey !== undefined ? { dedupeKey } : {}),
      },
      { actorUserId: context.actorUserId },
    );
  }

  private async requireDeal(
    scope: DealScope,
    dealId: string,
    options?: FindDealByIdOptions,
  ): Promise<DealRecord> {
    const deal = await this.dealRepository.findById(scope, dealId, options);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    return deal;
  }
}

function toClientScope(scope: DealScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}

function toLeadScope(scope: DealScope): LeadScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

const PROJECT_SERVICE_TYPE_VALUES = new Set<string>(Object.values(ProjectServiceType));

function mapDealServiceToProjectServiceType(service: string | null): ProjectServiceType | null {
  if (service === null || service.trim().length === 0) {
    return null;
  }

  const normalized = service
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (PROJECT_SERVICE_TYPE_VALUES.has(normalized)) {
    return normalized as ProjectServiceType;
  }

  return null;
}

function resolveForecastPeriod(
  period: GetDealForecastQuery['period'],
  asOf: Date,
): { periodStart: Date; periodEnd: Date } {
  const year = asOf.getUTCFullYear();
  const month = asOf.getUTCMonth();
  const day = asOf.getUTCDate();

  switch (period) {
    case 'week': {
      const dayOfWeek = asOf.getUTCDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const periodStart = new Date(Date.UTC(year, month, day + mondayOffset));
      const periodEnd = new Date(Date.UTC(year, month, day + mondayOffset + 6, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }
    case 'quarter': {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const periodStart = new Date(Date.UTC(year, quarterStartMonth, 1));
      const periodEnd = new Date(Date.UTC(year, quarterStartMonth + 3, 0, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }
    case 'year': {
      const periodStart = new Date(Date.UTC(year, 0, 1));
      const periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }
    case 'month':
    default: {
      const periodStart = new Date(Date.UTC(year, month, 1));
      const periodEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
      return { periodStart, periodEnd };
    }
  }
}
