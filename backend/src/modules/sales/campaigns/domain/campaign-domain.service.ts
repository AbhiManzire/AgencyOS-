import type { SalesCampaignStatus } from '@prisma/client';
import type { CampaignRecord } from '../repositories/campaign.repository.interface';
import { CAMPAIGN_DOMAIN_ERROR_CODES, CampaignDomainError } from './campaign-domain.errors';
import {
  CAMPAIGN_RESTORABLE_STATUSES,
  type CreateCampaignValidationInput,
  type RestoreCampaignValidationInput,
  type UpdateCampaignValidationInput,
} from './campaign-domain.types';

const VALID_STATUSES: readonly SalesCampaignStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ARCHIVED',
];

const CREATABLE_STATUSES: readonly SalesCampaignStatus[] = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
];

export class CampaignDomainService {
  validateCreate(input: CreateCampaignValidationInput): void {
    this.assertNameRequired(input.name);

    if (input.status !== undefined) {
      this.assertCreatableStatus(input.status);
    }

    this.assertDateRange(input.startsAt, input.endsAt);
  }

  validateUpdate(campaign: CampaignRecord, input: UpdateCampaignValidationInput): void {
    this.assertCampaignIsActive(campaign);

    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }

    if (input.status !== undefined) {
      if (input.status === 'ARCHIVED') {
        throw new CampaignDomainError(
          CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_STATUS,
          'Use the archive endpoint to archive a campaign.',
        );
      }
      this.assertValidStatus(input.status);
    }

    const startsAt = input.startsAt !== undefined ? input.startsAt : campaign.startsAt;
    const endsAt = input.endsAt !== undefined ? input.endsAt : campaign.endsAt;
    this.assertDateRange(startsAt, endsAt);
  }

  validateArchive(campaign: CampaignRecord): void {
    this.assertCampaignIsActive(campaign);
  }

  validateRestore(campaign: CampaignRecord, input: RestoreCampaignValidationInput = {}): void {
    if (campaign.deletedAt === null && campaign.status !== 'ARCHIVED') {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_NOT_ARCHIVED,
        'Campaign is not archived.',
      );
    }

    const targetStatus = input.targetStatus ?? 'DRAFT';
    if (!CAMPAIGN_RESTORABLE_STATUSES.includes(targetStatus)) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${targetStatus}" is not allowed when restoring a campaign.`,
      );
    }
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.NAME_REQUIRED,
        'Campaign name is required.',
      );
    }
  }

  private assertValidStatus(status: SalesCampaignStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Campaign status is invalid.',
      );
    }
  }

  private assertCreatableStatus(status: SalesCampaignStatus): void {
    if (!CREATABLE_STATUSES.includes(status)) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when creating a campaign.`,
      );
    }
  }

  private assertDateRange(startsAt?: Date | null, endsAt?: Date | null): void {
    if (startsAt == null || endsAt == null) {
      return;
    }

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Campaign start and end dates must be valid.',
      );
    }

    if (endsAt.getTime() < startsAt.getTime()) {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Campaign end date must be on or after the start date.',
      );
    }
  }

  private assertCampaignIsActive(campaign: CampaignRecord): void {
    if (campaign.deletedAt !== null || campaign.status === 'ARCHIVED') {
      throw new CampaignDomainError(
        CAMPAIGN_DOMAIN_ERROR_CODES.CAMPAIGN_ARCHIVED,
        'Campaign is archived and cannot be modified.',
      );
    }
  }
}
