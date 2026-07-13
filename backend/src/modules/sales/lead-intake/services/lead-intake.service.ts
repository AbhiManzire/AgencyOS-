import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CAMPAIGN_REPOSITORY,
  type CampaignRepository,
} from '../../campaigns/repositories/campaign.repository.interface';
import type {
  LeadApplicationContext,
  LeadScope,
} from '../../leads/services/lead-application.types';
import type { LeadRecord } from '../../leads/repositories/lead.repository.interface';
import { LeadService } from '../../leads/services/lead.service';
import { LeadIntakeRegistry } from '../lead-intake.registry';
import type { LeadIntakeProviderSummary, NormalizedLeadIntake } from '../lead-intake.types';

export interface LeadIntakeContext {
  readonly actorUserId: string;
}

@Injectable()
export class LeadIntakeService {
  constructor(
    private readonly registry: LeadIntakeRegistry,
    private readonly leadService: LeadService,
    private readonly prisma: PrismaService,
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepository,
  ) {}

  listProviders(): readonly LeadIntakeProviderSummary[] {
    return this.registry.list();
  }

  async ingest(
    scope: LeadScope,
    providerKey: string,
    payload: unknown,
    context: LeadIntakeContext,
  ): Promise<LeadRecord> {
    const provider = this.registry.getOrThrow(providerKey);
    const normalized = provider.normalize(payload);

    if (normalized.externalId !== undefined && normalized.externalId.length > 0) {
      const existing = await this.prisma.lead.findFirst({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          intakeProvider: provider.key,
          externalId: normalized.externalId,
          deletedAt: null,
        },
      });

      if (existing !== null) {
        return this.leadService.getLead(scope, existing.id);
      }
    }

    const campaignId = await this.resolveCampaignId(scope, normalized.campaignCode);
    const notes = this.mergeNotes(normalized);

    const applicationContext: LeadApplicationContext = {
      actorUserId: context.actorUserId,
    };

    return this.leadService.createLead(
      scope,
      {
        company: normalized.company,
        contactPerson: normalized.contactPerson,
        email: normalized.email,
        phone: normalized.phone,
        whatsapp: normalized.whatsapp,
        website: normalized.website,
        industry: normalized.industry,
        country: normalized.country,
        notes,
        source: provider.defaultSource,
        campaignId,
        intakeProvider: provider.key,
        externalId: normalized.externalId,
      },
      applicationContext,
    );
  }

  private async resolveCampaignId(
    scope: LeadScope,
    campaignCode: string | undefined,
  ): Promise<string | null> {
    if (campaignCode === undefined || campaignCode.trim().length === 0) {
      return null;
    }

    const campaign = await this.campaignRepository.findByCode(scope, campaignCode.trim());
    return campaign?.id ?? null;
  }

  private mergeNotes(normalized: NormalizedLeadIntake): string | undefined {
    const parts: string[] = [];
    if (normalized.notes !== undefined && normalized.notes.trim().length > 0) {
      parts.push(normalized.notes.trim());
    }
    if (normalized.metadata !== undefined) {
      parts.push(`Intake metadata: ${JSON.stringify(normalized.metadata)}`);
    }
    return parts.length > 0 ? parts.join('\n\n') : undefined;
  }
}
