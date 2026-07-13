import { Inject, Injectable, Logger } from '@nestjs/common';
import type { LeadSource, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { WorkflowEventDispatcher } from '../../../automation/services/workflow-event-dispatcher.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { ClientService } from '../../../clients/services/client.service';
import { SalesNotificationEmitter } from '../../../notifications/events/sales-notification.emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { LeadDomainService } from '../domain/lead-domain.service';
import { LEAD_DOMAIN_ERROR_CODES, LeadDomainError } from '../domain/lead-domain.errors';
import {
  LEAD_REPOSITORY,
  type ConvertLeadData,
  type CreateLeadData,
  type FindLeadByIdOptions,
  type LeadRepository,
  type LeadTransactionClient,
  type UpdateLeadData,
} from '../repositories/lead.repository.interface';
import type {
  CreateLeadCommand,
  GetLeadOptions,
  LeadApplicationContext,
  LeadRecord,
  LeadScope,
  ListLeadsQuery,
  ListLeadsResult,
  RestoreLeadCommand,
  UpdateLeadCommand,
} from './lead-application.types';

const VALID_LEAD_SOURCES: ReadonlySet<string> = new Set([
  'MANUAL',
  'WEBSITE',
  'META_ADS',
  'GOOGLE_ADS',
  'WHATSAPP',
  'EMAIL',
  'CALL',
  'REFERRAL',
  'IMPORT',
  'API',
  'WEBHOOK',
]);

/**
 * Application service — orchestrates lead use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepository: LeadRepository,
    private readonly leadDomainService: LeadDomainService,
    private readonly activityService: ActivityService,
    private readonly clientService: ClientService,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
    private readonly workflowEventDispatcher: WorkflowEventDispatcher,
    private readonly prisma: PrismaService,
  ) {}

  async createLead(
    scope: LeadScope,
    command: CreateLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const actorUserId = normalizeActorUserId(context.actorUserId);

    this.leadDomainService.validateCreate({
      company: command.company,
      contactPerson: command.contactPerson,
      email: command.email,
      phone: command.phone,
      website: command.website,
      source: command.source,
      status: command.status,
      priority: command.priority,
      expectedDealSize: command.expectedDealSize,
      decisionMaker: command.decisionMaker,
      budgetNotes: command.budgetNotes,
      timeline: command.timeline,
    });

    const now = new Date();
    const leadScore = this.leadDomainService.calculateLeadScore({
      company: command.company,
      email: command.email,
      phone: command.phone,
      website: command.website,
      decisionMaker: command.decisionMaker,
      budgetNotes: command.budgetNotes,
      timeline: command.timeline,
    });

    const data: CreateLeadData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      code: this.leadDomainService.normalizeOptionalString(command.code),
      company: this.leadDomainService.normalizeRequiredString(command.company),
      contactPerson: this.leadDomainService.normalizeOptionalString(command.contactPerson),
      email: this.leadDomainService.normalizeOptionalEmail(command.email),
      phone: this.leadDomainService.normalizeOptionalString(command.phone),
      whatsapp: this.leadDomainService.normalizeOptionalString(command.whatsapp),
      website: this.leadDomainService.normalizeOptionalString(command.website),
      industry: this.leadDomainService.normalizeOptionalString(command.industry),
      country: this.leadDomainService.normalizeOptionalString(command.country),
      source: command.source ?? 'MANUAL',
      campaignId: command.campaignId ?? null,
      intakeProvider:
        this.leadDomainService.normalizeOptionalString(command.intakeProvider) ?? null,
      externalId: this.leadDomainService.normalizeOptionalString(command.externalId) ?? null,
      assignedToUserId: command.assignedToUserId ?? null,
      status: command.status ?? 'NEW',
      leadScore,
      priority: command.priority ?? 'MEDIUM',
      expectedDealSize: command.expectedDealSize ?? null,
      notes: this.leadDomainService.normalizeOptionalString(command.notes),
      need: this.leadDomainService.normalizeOptionalString(command.need),
      authority: this.leadDomainService.normalizeOptionalString(command.authority),
      budgetNotes: this.leadDomainService.normalizeOptionalString(command.budgetNotes),
      timeline: this.leadDomainService.normalizeOptionalString(command.timeline),
      painPoints: this.leadDomainService.normalizeOptionalString(command.painPoints),
      decisionMaker: this.leadDomainService.normalizeOptionalString(command.decisionMaker),
      competitor: this.leadDomainService.normalizeOptionalString(command.competitor),
      qualificationNotes: this.leadDomainService.normalizeOptionalString(
        command.qualificationNotes,
      ),
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    const created = await this.runInTransaction(async (tx) => {
      const lead = await this.leadRepository.create(data, tx);
      const activityContext = { actorUserId: actorUserId ?? '' };

      await this.emitActivity(
        scope,
        lead.id,
        'LEAD_CREATED',
        'Lead Created',
        activityContext,
        undefined,
        'Lead was created.',
        `lead.created:${lead.id}`,
      );

      if (lead.assignedToUserId !== null) {
        await this.emitActivity(
          scope,
          lead.id,
          'OWNER_CHANGED',
          'Owner Changed',
          activityContext,
          { assignedToUserId: lead.assignedToUserId },
          'Lead owner was assigned.',
          `lead.assigned:${lead.id}:${lead.assignedToUserId}`,
        );
      }

      return lead;
    });

    if (created.assignedToUserId !== null) {
      await this.emitAssignmentNotification(scope, created);
      this.emitWorkflowEvent(scope, 'LEAD_ASSIGNED', created, actorUserId);
    }

    this.emitWorkflowEvent(scope, 'LEAD_CREATED', created, actorUserId);

    return created;
  }

  async createImportedLead(
    scope: LeadScope,
    command: CreateLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const source = resolveImportSource(command.source);

    this.leadDomainService.validateImportRow({
      company: command.company,
      contactPerson: command.contactPerson,
      email: command.email,
      phone: command.phone,
      website: command.website,
      source,
      status: command.status,
      priority: command.priority,
      expectedDealSize: command.expectedDealSize,
      decisionMaker: command.decisionMaker,
      budgetNotes: command.budgetNotes,
      timeline: command.timeline,
    });

    const now = new Date();
    const leadScore = this.leadDomainService.calculateLeadScore({
      company: command.company,
      email: command.email,
      phone: command.phone,
      website: command.website,
      decisionMaker: command.decisionMaker,
      budgetNotes: command.budgetNotes,
      timeline: command.timeline,
    });

    const data: CreateLeadData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      code: this.leadDomainService.normalizeOptionalString(command.code),
      company: this.leadDomainService.normalizeRequiredString(command.company),
      contactPerson: this.leadDomainService.normalizeOptionalString(command.contactPerson),
      email: this.leadDomainService.normalizeOptionalEmail(command.email),
      phone: this.leadDomainService.normalizeOptionalString(command.phone),
      whatsapp: this.leadDomainService.normalizeOptionalString(command.whatsapp),
      website: this.leadDomainService.normalizeOptionalString(command.website),
      industry: this.leadDomainService.normalizeOptionalString(command.industry),
      country: this.leadDomainService.normalizeOptionalString(command.country),
      source,
      campaignId: command.campaignId ?? null,
      intakeProvider:
        this.leadDomainService.normalizeOptionalString(command.intakeProvider) ?? null,
      externalId: this.leadDomainService.normalizeOptionalString(command.externalId) ?? null,
      assignedToUserId: command.assignedToUserId ?? null,
      status: command.status ?? 'NEW',
      leadScore,
      priority: command.priority ?? 'MEDIUM',
      expectedDealSize: command.expectedDealSize ?? null,
      notes: this.leadDomainService.normalizeOptionalString(command.notes),
      need: this.leadDomainService.normalizeOptionalString(command.need),
      authority: this.leadDomainService.normalizeOptionalString(command.authority),
      budgetNotes: this.leadDomainService.normalizeOptionalString(command.budgetNotes),
      timeline: this.leadDomainService.normalizeOptionalString(command.timeline),
      painPoints: this.leadDomainService.normalizeOptionalString(command.painPoints),
      decisionMaker: this.leadDomainService.normalizeOptionalString(command.decisionMaker),
      competitor: this.leadDomainService.normalizeOptionalString(command.competitor),
      qualificationNotes: this.leadDomainService.normalizeOptionalString(
        command.qualificationNotes,
      ),
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    const created = await this.runInTransaction(async (tx) => {
      const lead = await this.leadRepository.create(data, tx);
      const activityContext = { actorUserId: actorUserId ?? '' };

      await this.emitActivity(
        scope,
        lead.id,
        'LEAD_CREATED',
        'Lead Imported',
        activityContext,
        undefined,
        'Lead was imported.',
        `lead.created:${lead.id}`,
      );

      if (lead.assignedToUserId !== null) {
        await this.emitActivity(
          scope,
          lead.id,
          'OWNER_CHANGED',
          'Owner Changed',
          activityContext,
          { assignedToUserId: lead.assignedToUserId },
          'Lead owner was assigned.',
          `lead.assigned:${lead.id}:${lead.assignedToUserId}`,
        );
      }

      return lead;
    });

    if (created.assignedToUserId !== null) {
      await this.emitAssignmentNotification(scope, created);
    }

    return created;
  }

  async updateLead(
    scope: LeadScope,
    leadId: string,
    command: UpdateLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.requireLead(scope, leadId, { includeArchived: true });
    const actorUserId = normalizeActorUserId(context.actorUserId);

    this.leadDomainService.validateUpdate(existing, {
      company: command.company,
      contactPerson: command.contactPerson,
      email: command.email,
      phone: command.phone,
      website: command.website,
      source: command.source,
      status: command.status,
      priority: command.priority,
      expectedDealSize: command.expectedDealSize,
      decisionMaker: command.decisionMaker,
      budgetNotes: command.budgetNotes,
      timeline: command.timeline,
    });

    const now = new Date();
    const nextCompany =
      command.company !== undefined
        ? this.leadDomainService.normalizeRequiredString(command.company)
        : existing.company;
    const nextEmail =
      command.email !== undefined
        ? (this.leadDomainService.normalizeOptionalEmail(command.email) ?? null)
        : existing.email;
    const nextPhone =
      command.phone !== undefined
        ? (this.leadDomainService.normalizeOptionalString(command.phone) ?? null)
        : existing.phone;
    const nextWebsite =
      command.website !== undefined
        ? (this.leadDomainService.normalizeOptionalString(command.website) ?? null)
        : existing.website;
    const nextDecisionMaker =
      command.decisionMaker !== undefined
        ? (this.leadDomainService.normalizeOptionalString(command.decisionMaker) ?? null)
        : existing.decisionMaker;
    const nextBudgetNotes =
      command.budgetNotes !== undefined
        ? (this.leadDomainService.normalizeOptionalString(command.budgetNotes) ?? null)
        : existing.budgetNotes;
    const nextTimeline =
      command.timeline !== undefined
        ? (this.leadDomainService.normalizeOptionalString(command.timeline) ?? null)
        : existing.timeline;

    const leadScore = this.leadDomainService.calculateLeadScore({
      company: nextCompany,
      email: nextEmail,
      phone: nextPhone,
      website: nextWebsite,
      decisionMaker: nextDecisionMaker,
      budgetNotes: nextBudgetNotes,
      timeline: nextTimeline,
    });

    const data: UpdateLeadData = {
      ...(command.code !== undefined
        ? { code: this.leadDomainService.normalizeOptionalString(command.code) }
        : {}),
      ...(command.company !== undefined ? { company: nextCompany } : {}),
      ...(command.contactPerson !== undefined
        ? { contactPerson: this.leadDomainService.normalizeOptionalString(command.contactPerson) }
        : {}),
      ...(command.email !== undefined ? { email: nextEmail } : {}),
      ...(command.phone !== undefined ? { phone: nextPhone } : {}),
      ...(command.whatsapp !== undefined
        ? { whatsapp: this.leadDomainService.normalizeOptionalString(command.whatsapp) }
        : {}),
      ...(command.website !== undefined ? { website: nextWebsite } : {}),
      ...(command.industry !== undefined
        ? { industry: this.leadDomainService.normalizeOptionalString(command.industry) }
        : {}),
      ...(command.country !== undefined
        ? { country: this.leadDomainService.normalizeOptionalString(command.country) }
        : {}),
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.campaignId !== undefined ? { campaignId: command.campaignId } : {}),
      ...(command.assignedToUserId !== undefined
        ? { assignedToUserId: command.assignedToUserId }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      leadScore,
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.expectedDealSize !== undefined
        ? { expectedDealSize: command.expectedDealSize }
        : {}),
      ...(command.notes !== undefined
        ? { notes: this.leadDomainService.normalizeOptionalString(command.notes) }
        : {}),
      ...(command.need !== undefined
        ? { need: this.leadDomainService.normalizeOptionalString(command.need) }
        : {}),
      ...(command.authority !== undefined
        ? { authority: this.leadDomainService.normalizeOptionalString(command.authority) }
        : {}),
      ...(command.budgetNotes !== undefined ? { budgetNotes: nextBudgetNotes } : {}),
      ...(command.timeline !== undefined ? { timeline: nextTimeline } : {}),
      ...(command.painPoints !== undefined
        ? { painPoints: this.leadDomainService.normalizeOptionalString(command.painPoints) }
        : {}),
      ...(command.decisionMaker !== undefined ? { decisionMaker: nextDecisionMaker } : {}),
      ...(command.competitor !== undefined
        ? { competitor: this.leadDomainService.normalizeOptionalString(command.competitor) }
        : {}),
      ...(command.qualificationNotes !== undefined
        ? {
            qualificationNotes: this.leadDomainService.normalizeOptionalString(
              command.qualificationNotes,
            ),
          }
        : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    const updated = await this.runInTransaction(async (tx) => {
      const lead = await this.leadRepository.update(scope, leadId, data, tx);
      if (lead === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      const activityContext = { actorUserId: actorUserId ?? '' };
      const assigneeChanged =
        command.assignedToUserId !== undefined &&
        command.assignedToUserId !== existing.assignedToUserId;
      const statusChanged = command.status !== undefined && command.status !== existing.status;

      if (assigneeChanged) {
        await this.emitActivity(
          scope,
          lead.id,
          'OWNER_CHANGED',
          'Owner Changed',
          activityContext,
          {
            from: existing.assignedToUserId,
            to: lead.assignedToUserId,
          },
          'Lead owner was updated.',
          `lead.assigned:${lead.id}:${lead.assignedToUserId ?? 'none'}`,
        );
      } else if (statusChanged) {
        await this.emitActivity(
          scope,
          lead.id,
          'STATUS_CHANGED',
          'Status Changed',
          activityContext,
          { from: existing.status, to: lead.status },
          `Status changed from ${existing.status} to ${lead.status}.`,
          `lead.status_changed:${lead.id}:${existing.status}:${lead.status}`,
        );
      } else {
        await this.emitActivity(
          scope,
          lead.id,
          'LEAD_UPDATED',
          'Lead Updated',
          activityContext,
          undefined,
          'Lead details were updated.',
          `lead.updated:${lead.id}:${now.toISOString()}`,
        );
      }

      return lead;
    });

    if (
      command.assignedToUserId !== undefined &&
      command.assignedToUserId !== null &&
      command.assignedToUserId !== existing.assignedToUserId
    ) {
      await this.emitAssignmentNotification(scope, updated);
      this.emitWorkflowEvent(scope, 'LEAD_ASSIGNED', updated, actorUserId);
    }

    if (
      command.status !== undefined &&
      command.status !== existing.status &&
      command.status === 'QUALIFIED'
    ) {
      this.emitWorkflowEvent(scope, 'LEAD_QUALIFIED', updated, actorUserId);
    }

    this.emitWorkflowEvent(scope, 'LEAD_UPDATED', updated, actorUserId);

    return updated;
  }

  async archiveLead(
    scope: LeadScope,
    leadId: string,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.requireLead(scope, leadId);
    this.leadDomainService.validateArchive(existing);
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.leadRepository.archive(
        scope,
        leadId,
        {
          status: 'ARCHIVED',
          deletedAt: now,
          deletedByUserId: actorUserId,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
        tx,
      );

      if (archived === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      await this.emitActivity(
        scope,
        archived.id,
        'CUSTOM',
        'Archived',
        { actorUserId: actorUserId ?? '' },
        undefined,
        'Lead was archived.',
        `lead.archived:${archived.id}`,
      );
      return archived;
    });
  }

  async restoreLead(
    scope: LeadScope,
    leadId: string,
    command: RestoreLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.leadRepository.findById(scope, leadId, { includeArchived: true });

    if (existing === null) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
    }

    this.leadDomainService.validateRestore(existing, { targetStatus: command.targetStatus });
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const now = new Date();
    const targetStatus = command.targetStatus ?? 'NEW';

    return this.runInTransaction(async (tx) => {
      const restored = await this.leadRepository.restore(
        scope,
        leadId,
        {
          status: targetStatus,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
        tx,
      );

      if (restored === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      await this.emitActivity(
        scope,
        restored.id,
        'CUSTOM',
        'Restored',
        { actorUserId: actorUserId ?? '' },
        undefined,
        'Lead was restored.',
        `lead.restored:${restored.id}`,
      );
      return restored;
    });
  }

  async convertLead(
    scope: LeadScope,
    leadId: string,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.requireLead(scope, leadId);
    this.leadDomainService.validateConvert(existing);

    const now = new Date();
    const clientScope: ClientScope = { tenantId: scope.tenantId, workspaceId: scope.workspaceId };

    const client = await this.clientService.createClient(
      clientScope,
      {
        displayName: existing.company,
        email: existing.email,
        phone: existing.phone,
        website: existing.website,
        industry: existing.industry,
        source: 'SALES_CONVERSION',
        status: 'PROSPECT',
        ownerUserId: existing.assignedToUserId,
      },
      { actorUserId: context.actorUserId },
    );

    const data: ConvertLeadData = {
      status: 'CONVERTED',
      convertedClientId: client.id,
      convertedAt: now,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const converted = await this.leadRepository.convert(scope, leadId, data, tx);

      if (converted === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      await this.emitActivity(
        scope,
        converted.id,
        'CLIENT_CONVERTED',
        'Converted',
        context,
        { convertedClientId: client.id },
        'Lead was converted to a client.',
        `lead.converted:${converted.id}`,
      );

      this.emitWorkflowEvent(scope, 'LEAD_CONVERTED', converted, context.actorUserId, {
        convertedClientId: client.id,
      });

      return converted;
    });
  }

  async getLead(
    scope: LeadScope,
    leadId: string,
    options: GetLeadOptions = {},
  ): Promise<LeadRecord> {
    const lead = await this.leadRepository.findById(scope, leadId, {
      includeArchived: options.includeArchived,
    });

    if (lead === null) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
    }

    this.leadDomainService.ensureWorkspaceOwnership(scope, lead);
    return lead;
  }

  async listLeads(scope: LeadScope, query: ListLeadsQuery = {}): Promise<ListLeadsResult> {
    return this.leadRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      q: query.q,
      status: query.status,
      source: query.source,
      assignedToUserId: query.assignedToUserId,
      campaignId: query.campaignId,
      priority: query.priority,
      industry: query.industry,
      country: query.country,
      includeArchived: query.includeArchived,
      archivedOnly: query.archivedOnly,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  private emitWorkflowEvent(
    scope: LeadScope,
    triggerType: string,
    lead: LeadRecord,
    actorUserId?: string | null,
    extra?: Record<string, unknown>,
  ): void {
    void this.workflowEventDispatcher
      .dispatch({
        scope: { tenantId: scope.tenantId, workspaceId: scope.workspaceId },
        triggerType,
        entityType: 'lead',
        entityId: lead.id,
        actorUserId: actorUserId ?? undefined,
        payload: {
          entityType: 'lead',
          entityId: lead.id,
          id: lead.id,
          status: lead.status,
          assignedToUserId: lead.assignedToUserId,
          company: lead.company,
          ...(extra ?? {}),
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Workflow emit ${triggerType} failed for lead ${lead.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private async emitAssignmentNotification(scope: LeadScope, lead: LeadRecord): Promise<void> {
    if (lead.assignedToUserId === null) {
      return;
    }

    await this.salesNotificationEmitter.emitNewLeadAssigned({
      scope: { tenantId: scope.tenantId, workspaceId: scope.workspaceId },
      recipientUserId: lead.assignedToUserId,
      company: lead.company,
      contactPerson: lead.contactPerson,
      leadId: lead.id,
    });
  }

  private async runInTransaction<T>(work: (tx: LeadTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async emitActivity(
    scope: LeadScope,
    leadId: string,
    type: string,
    title: string,
    context: LeadApplicationContext,
    metadata?: Prisma.InputJsonValue,
    description?: string,
    dedupeKey?: string,
  ): Promise<void> {
    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'lead',
        entityId: leadId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
        ...(dedupeKey !== undefined ? { dedupeKey } : {}),
      },
      { actorUserId: context.actorUserId },
    );
  }

  private async requireLead(
    scope: LeadScope,
    leadId: string,
    options?: FindLeadByIdOptions,
  ): Promise<LeadRecord> {
    const lead = await this.leadRepository.findById(scope, leadId, options);

    if (lead === null) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
    }

    return lead;
  }
}

function normalizeActorUserId(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  return value;
}

function resolveImportSource(source: LeadSource | undefined): LeadSource {
  if (source !== undefined && VALID_LEAD_SOURCES.has(source)) {
    return source;
  }
  return 'IMPORT';
}
