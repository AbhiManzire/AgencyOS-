import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import type { ProjectScope } from '../../../projects/repositories/project.repository.interface';
import { ProjectService } from '../../../projects/services/project.service';
import { PrismaService } from '../../../prisma/prisma.service';
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
  DealApplicationContext,
  DealRecord,
  GetDealOptions,
  ListDealsQuery,
  ListDealsResult,
  UpdateDealCommand,
} from './deal-application.types';

@Injectable()
export class DealService {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    private readonly dealDomainService: DealDomainService,
    private readonly activityService: ActivityService,
    private readonly projectService: ProjectService,
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

    const now = new Date();
    const stage = command.stage ?? 'NEW';
    const dealId = randomUUID();

    const data: CreateDealData = {
      id: dealId,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      contactId: command.contactId ?? null,
      leadId: command.leadId ?? null,
      title: this.dealDomainService.normalizeTitle(command.title),
      value: command.value,
      currency: command.currency ?? 'USD',
      expectedCloseDate: command.expectedCloseDate ?? null,
      ownerUserId: command.ownerUserId ?? null,
      stage,
      service: normalizeOptionalString(command.service),
      probability: command.probability ?? 0,
      priority: command.priority ?? 'MEDIUM',
      stageEnteredAt: now,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const created = await this.dealRepository.create(data, tx);

      await this.dealRepository.createStageHistory(
        {
          id: randomUUID(),
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          dealId: created.id,
          fromStage: stage,
          toStage: stage,
          enteredAt: now,
          changedByUserId: context.actorUserId,
        },
        tx,
      );

      await this.emitActivity(
        scope,
        created.id,
        'deal.created',
        'Deal Created',
        context,
        undefined,
        'Deal was created.',
      );

      if (created.ownerUserId !== null) {
        await this.emitActivity(
          scope,
          created.id,
          'deal.assigned',
          'Deal Assigned',
          context,
          { ownerUserId: created.ownerUserId },
          'Deal owner was assigned.',
        );
      }

      return created;
    });
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

    const data: UpdateDealData = {
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.contactId !== undefined ? { contactId: command.contactId } : {}),
      ...(command.leadId !== undefined ? { leadId: command.leadId } : {}),
      ...(command.title !== undefined
        ? { title: this.dealDomainService.normalizeTitle(command.title) }
        : {}),
      ...(command.value !== undefined ? { value: command.value } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.expectedCloseDate !== undefined
        ? { expectedCloseDate: command.expectedCloseDate }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.stage !== undefined ? { stage: command.stage } : {}),
      ...(command.service !== undefined
        ? { service: normalizeOptionalString(command.service) }
        : {}),
      ...(command.probability !== undefined ? { probability: command.probability } : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
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
        await this.dealRepository.createStageHistory(
          {
            id: randomUUID(),
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            dealId,
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
          'deal.stage_changed',
          'Stage Changed',
          context,
          { from: existing.stage, to: updated.stage },
          `Stage changed from ${existing.stage} to ${updated.stage}.`,
        );

        if (updated.stage === 'WON') {
          await this.emitActivity(
            scope,
            updated.id,
            'deal.won',
            'Deal Won',
            context,
            undefined,
            'Deal was marked as won.',
          );
        }

        if (updated.stage === 'LOST') {
          await this.emitActivity(
            scope,
            updated.id,
            'deal.lost',
            'Deal Lost',
            context,
            undefined,
            'Deal was marked as lost.',
          );
        }
      }

      if (ownerChanged) {
        await this.emitActivity(
          scope,
          updated.id,
          'deal.assigned',
          'Deal Assigned',
          context,
          { ownerUserId: updated.ownerUserId },
          'Deal owner was updated.',
        );
      }

      if (!stageChanged && !ownerChanged) {
        await this.emitActivity(
          scope,
          updated.id,
          'deal.updated',
          'Deal Updated',
          context,
          undefined,
          'Deal details were updated.',
        );
      }

      return updated;
    });
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
        'deal.archived',
        'Archived',
        context,
        undefined,
        'Deal was archived.',
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

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const restored = await this.dealRepository.restore(
        scope,
        dealId,
        {
          stage: 'NEW',
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
          toStage: 'NEW',
          enteredAt: now,
          changedByUserId: context.actorUserId,
        },
        tx,
      );

      await this.emitActivity(
        scope,
        restored.id,
        'deal.restored',
        'Restored',
        context,
        undefined,
        'Deal was restored.',
      );

      return restored;
    });
  }

  async convertToProject(
    scope: DealScope,
    dealId: string,
    context: DealApplicationContext,
  ): Promise<DealRecord> {
    const deal = await this.requireDeal(scope, dealId, { includeArchived: true });
    this.dealDomainService.validateConvertToProject(deal);

    const projectScope: ProjectScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
    };

    const project = await this.projectService.createProject(
      projectScope,
      {
        clientId: deal.clientId,
        name: deal.title,
        projectManagerUserId: deal.ownerUserId ?? context.actorUserId,
        budgetAmount: deal.value,
        status: 'PLANNING',
      },
      { actorUserId: context.actorUserId },
    );

    await this.prisma.project.update({
      where: { id: project.id },
      data: { dealId: deal.id },
    });

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
        'deal.converted_to_project',
        'Converted to Project',
        context,
        { projectId: project.id },
        `Deal was converted to project "${project.name}".`,
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
        'deal.converted_to_invoice',
        'Converted to Invoice',
        context,
        { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber },
        `Deal was converted to invoice ${invoice.invoiceNumber}.`,
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
  ): Promise<void> {
    await this.activityService.createActivity(
      scope,
      {
        entityType: 'deal',
        entityId: dealId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
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

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
