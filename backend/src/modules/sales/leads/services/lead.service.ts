import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { ClientService } from '../../../clients/services/client.service';
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

/**
 * Application service — orchestrates lead use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class LeadService {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepository: LeadRepository,
    private readonly leadDomainService: LeadDomainService,
    private readonly activityService: ActivityService,
    private readonly clientService: ClientService,
    private readonly prisma: PrismaService,
  ) {}

  async createLead(
    scope: LeadScope,
    command: CreateLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    this.leadDomainService.validateCreate({
      company: command.company,
      leadScore: command.leadScore,
      status: command.status,
      priority: command.priority,
      source: command.source,
      expectedDealSize: command.expectedDealSize,
    });

    const now = new Date();

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
      source: command.source ?? 'OTHER',
      assignedToUserId: command.assignedToUserId ?? null,
      status: command.status ?? 'NEW',
      leadScore: command.leadScore ?? null,
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
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const created = await this.leadRepository.create(data, tx);
      await this.emitActivity(
        scope,
        created.id,
        'lead.created',
        'Lead Created',
        context,
        undefined,
        'Lead was created.',
      );
      return created;
    });
  }

  async updateLead(
    scope: LeadScope,
    leadId: string,
    command: UpdateLeadCommand,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.requireLead(scope, leadId, { includeArchived: true });

    this.leadDomainService.validateUpdate(existing, {
      company: command.company,
      leadScore: command.leadScore,
      status: command.status,
      priority: command.priority,
      source: command.source,
      expectedDealSize: command.expectedDealSize,
    });

    const now = new Date();

    const data: UpdateLeadData = {
      ...(command.code !== undefined
        ? { code: this.leadDomainService.normalizeOptionalString(command.code) }
        : {}),
      ...(command.company !== undefined
        ? { company: this.leadDomainService.normalizeRequiredString(command.company) }
        : {}),
      ...(command.contactPerson !== undefined
        ? { contactPerson: this.leadDomainService.normalizeOptionalString(command.contactPerson) }
        : {}),
      ...(command.email !== undefined
        ? { email: this.leadDomainService.normalizeOptionalEmail(command.email) }
        : {}),
      ...(command.phone !== undefined
        ? { phone: this.leadDomainService.normalizeOptionalString(command.phone) }
        : {}),
      ...(command.whatsapp !== undefined
        ? { whatsapp: this.leadDomainService.normalizeOptionalString(command.whatsapp) }
        : {}),
      ...(command.website !== undefined
        ? { website: this.leadDomainService.normalizeOptionalString(command.website) }
        : {}),
      ...(command.industry !== undefined
        ? { industry: this.leadDomainService.normalizeOptionalString(command.industry) }
        : {}),
      ...(command.country !== undefined
        ? { country: this.leadDomainService.normalizeOptionalString(command.country) }
        : {}),
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.assignedToUserId !== undefined
        ? { assignedToUserId: command.assignedToUserId }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.leadScore !== undefined ? { leadScore: command.leadScore } : {}),
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
      ...(command.budgetNotes !== undefined
        ? { budgetNotes: this.leadDomainService.normalizeOptionalString(command.budgetNotes) }
        : {}),
      ...(command.timeline !== undefined
        ? { timeline: this.leadDomainService.normalizeOptionalString(command.timeline) }
        : {}),
      ...(command.painPoints !== undefined
        ? { painPoints: this.leadDomainService.normalizeOptionalString(command.painPoints) }
        : {}),
      ...(command.decisionMaker !== undefined
        ? { decisionMaker: this.leadDomainService.normalizeOptionalString(command.decisionMaker) }
        : {}),
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
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.leadRepository.update(scope, leadId, data, tx);
      if (updated === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      if (command.status !== undefined && command.status !== existing.status) {
        await this.emitActivity(
          scope,
          updated.id,
          'lead.status_changed',
          'Status Changed',
          context,
          { from: existing.status, to: updated.status },
          `Status changed from ${existing.status} to ${updated.status}.`,
        );
      } else {
        await this.emitActivity(
          scope,
          updated.id,
          'lead.updated',
          'Lead Updated',
          context,
          undefined,
          'Lead details were updated.',
        );
      }

      return updated;
    });
  }

  async archiveLead(
    scope: LeadScope,
    leadId: string,
    context: LeadApplicationContext,
  ): Promise<LeadRecord> {
    const existing = await this.requireLead(scope, leadId);
    this.leadDomainService.validateArchive(existing);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.leadRepository.archive(
        scope,
        leadId,
        {
          status: 'ARCHIVED',
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (archived === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      await this.emitActivity(
        scope,
        archived.id,
        'lead.archived',
        'Archived',
        context,
        undefined,
        'Lead was archived.',
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

    const now = new Date();
    const targetStatus = command.targetStatus ?? 'NEW';

    return this.runInTransaction(async (tx) => {
      const restored = await this.leadRepository.restore(
        scope,
        leadId,
        {
          status: targetStatus,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (restored === null) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
      }

      await this.emitActivity(
        scope,
        restored.id,
        'lead.restored',
        'Restored',
        context,
        undefined,
        'Lead was restored.',
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
        status: 'ACTIVE',
        ownerUserId: existing.assignedToUserId,
        becameClientAt: now,
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
        'lead.converted',
        'Converted',
        context,
        { convertedClientId: client.id },
        'Lead was converted to a client.',
      );

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
      priority: query.priority,
      industry: query.industry,
      country: query.country,
      includeArchived: query.includeArchived,
      archivedOnly: query.archivedOnly,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
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
  ): Promise<void> {
    await this.activityService.createActivity(
      scope,
      {
        entityType: 'lead',
        entityId: leadId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
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
