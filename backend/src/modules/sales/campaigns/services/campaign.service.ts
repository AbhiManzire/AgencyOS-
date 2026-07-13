import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CampaignDomainService } from '../domain/campaign-domain.service';
import { CAMPAIGN_DOMAIN_ERROR_CODES, CampaignDomainError } from '../domain/campaign-domain.errors';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepository,
  type CreateCampaignData,
  type UpdateCampaignData,
} from '../repositories/campaign.repository.interface';
import type {
  CampaignApplicationContext,
  CampaignRecord,
  CampaignScope,
  CreateCampaignCommand,
  ListCampaignsQuery,
  ListCampaignsResult,
  RestoreCampaignCommand,
  UpdateCampaignCommand,
} from './campaign-application.types';

@Injectable()
export class CampaignService {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
    private readonly campaignDomainService: CampaignDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createCampaign(
    scope: CampaignScope,
    command: CreateCampaignCommand,
    context: CampaignApplicationContext,
  ): Promise<CampaignRecord> {
    this.campaignDomainService.validateCreate({
      name: command.name,
      status: command.status,
      startsAt: command.startsAt,
      endsAt: command.endsAt,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const data: CreateCampaignData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: this.campaignDomainService.normalizeRequiredString(command.name),
      code: this.campaignDomainService.normalizeOptionalString(command.code) ?? null,
      description: this.campaignDomainService.normalizeOptionalString(command.description) ?? null,
      status: command.status ?? 'DRAFT',
      startsAt: command.startsAt ?? null,
      endsAt: command.endsAt ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    return this.runInTransaction(() => this.campaignRepository.create(data));
  }

  async listCampaigns(
    scope: CampaignScope,
    query: ListCampaignsQuery,
  ): Promise<ListCampaignsResult> {
    return this.campaignRepository.list({
      scope,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
      q: query.q,
      status: query.status,
      includeArchived: query.includeArchived ?? false,
    });
  }

  async getCampaign(scope: CampaignScope, id: string): Promise<CampaignRecord> {
    const campaign = await this.campaignRepository.findById(scope, id);

    if (campaign === null) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
        'Campaign was not found.',
      );
    }

    return campaign;
  }

  async updateCampaign(
    scope: CampaignScope,
    id: string,
    command: UpdateCampaignCommand,
    context: CampaignApplicationContext,
  ): Promise<CampaignRecord> {
    const existing = await this.requireActiveCampaign(scope, id);

    this.campaignDomainService.validateUpdate(existing, {
      name: command.name,
      status: command.status,
      startsAt: command.startsAt,
      endsAt: command.endsAt,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const data: UpdateCampaignData = {
      ...(command.name !== undefined
        ? { name: this.campaignDomainService.normalizeRequiredString(command.name) }
        : {}),
      ...(command.code !== undefined
        ? { code: this.campaignDomainService.normalizeOptionalString(command.code) ?? null }
        : {}),
      ...(command.description !== undefined
        ? {
            description:
              this.campaignDomainService.normalizeOptionalString(command.description) ?? null,
          }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.startsAt !== undefined ? { startsAt: command.startsAt } : {}),
      ...(command.endsAt !== undefined ? { endsAt: command.endsAt } : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.campaignRepository.update(scope, id, data);

      if (updated === null) {
        throw new CampaignDomainError(
          CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
          'Campaign was not found.',
        );
      }

      return updated;
    });
  }

  async archiveCampaign(
    scope: CampaignScope,
    id: string,
    context: CampaignApplicationContext,
  ): Promise<CampaignRecord> {
    const existing = await this.requireActiveCampaign(scope, id);
    this.campaignDomainService.validateArchive(existing);

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    return this.runInTransaction(async () => {
      const archived = await this.campaignRepository.archive(scope, id, {
        status: 'ARCHIVED',
        deletedAt: now,
        deletedByUserId: actorUserId,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (archived === null) {
        throw new CampaignDomainError(
          CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
          'Campaign was not found.',
        );
      }

      return archived;
    });
  }

  async restoreCampaign(
    scope: CampaignScope,
    id: string,
    command: RestoreCampaignCommand,
    context: CampaignApplicationContext,
  ): Promise<CampaignRecord> {
    const existing = await this.campaignRepository.findById(scope, id, { includeArchived: true });

    if (existing === null) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
        'Campaign was not found.',
      );
    }

    this.campaignDomainService.validateRestore(existing, { targetStatus: command.targetStatus });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const targetStatus = command.targetStatus ?? 'DRAFT';

    return this.runInTransaction(async () => {
      const restored = await this.campaignRepository.restore(scope, id, {
        status: targetStatus,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (restored === null) {
        throw new CampaignDomainError(
          CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
          'Campaign was not found.',
        );
      }

      return restored;
    });
  }

  private async requireActiveCampaign(scope: CampaignScope, id: string): Promise<CampaignRecord> {
    const campaign = await this.campaignRepository.findById(scope, id);

    if (campaign === null) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_FOUND,
        'Campaign was not found.',
      );
    }

    return campaign;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function normalizeActorUserId(actorUserId: string): string | null {
  const trimmed = actorUserId.trim();
  return trimmed.length > 0 ? trimmed : null;
}
