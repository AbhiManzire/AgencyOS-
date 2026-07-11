import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import type { LeadRecord, LeadScope } from '../repositories/lead.repository.interface';
import { LEAD_DOMAIN_ERROR_CODES, LeadDomainError } from './lead-domain.errors';
import {
  LEAD_RESTORABLE_STATUSES,
  type CreateLeadValidationInput,
  type RestoreLeadValidationInput,
  type UpdateLeadValidationInput,
} from './lead-domain.types';

const VALID_STATUSES: readonly LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
  'CONVERTED',
  'ARCHIVED',
];

const VALID_PRIORITIES: readonly LeadPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const VALID_SOURCES: readonly LeadSource[] = [
  'WEBSITE',
  'REFERRAL',
  'COLD_OUTREACH',
  'SOCIAL',
  'EVENT',
  'PARTNER',
  'OTHER',
];

const STATUS_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'ARCHIVED'],
  CONTACTED: ['QUALIFIED', 'DISQUALIFIED', 'ARCHIVED'],
  QUALIFIED: ['CONTACTED', 'DISQUALIFIED', 'CONVERTED', 'ARCHIVED'],
  DISQUALIFIED: ['NEW', 'ARCHIVED'],
  CONVERTED: ['ARCHIVED'],
  ARCHIVED: [],
};

/**
 * Pure domain service for lead business rules.
 * Framework-independent — no HTTP or NestJS dependencies.
 */
export class LeadDomainService {
  validateCreate(input: CreateLeadValidationInput): void {
    this.assertCompanyRequired(input.company);

    if (input.leadScore !== undefined && input.leadScore !== null) {
      this.assertLeadScoreValid(input.leadScore);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.source !== undefined) {
      this.assertValidSource(input.source);
    }

    if (input.expectedDealSize !== undefined && input.expectedDealSize !== null) {
      this.assertNonNegativeExpectedDealSize(input.expectedDealSize);
    }
  }

  validateUpdate(lead: LeadRecord, input: UpdateLeadValidationInput): void {
    this.assertLeadIsActive(lead);

    if (input.company !== undefined) {
      this.assertCompanyRequired(input.company);
    }

    if (input.leadScore !== undefined && input.leadScore !== null) {
      this.assertLeadScoreValid(input.leadScore);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusChangeableViaUpdate(input.status);
      this.assertStatusTransition(lead.status, input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.source !== undefined) {
      this.assertValidSource(input.source);
    }

    if (input.expectedDealSize !== undefined && input.expectedDealSize !== null) {
      this.assertNonNegativeExpectedDealSize(input.expectedDealSize);
    }
  }

  validateArchive(lead: LeadRecord): void {
    this.assertLeadIsActive(lead);
    this.assertStatusTransition(lead.status, 'ARCHIVED');
  }

  validateRestore(lead: LeadRecord, input: RestoreLeadValidationInput = {}): void {
    if (lead.deletedAt === null && lead.status !== 'ARCHIVED') {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_ARCHIVED, 'Lead is not archived.');
    }

    const targetStatus = input.targetStatus ?? 'NEW';
    if (!LEAD_RESTORABLE_STATUSES.includes(targetStatus)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${targetStatus}" is not allowed when restoring a lead.`,
      );
    }
  }

  validateConvert(lead: LeadRecord): void {
    this.assertLeadIsActive(lead);
    this.assertCompanyRequired(lead.company);

    if (lead.status === 'CONVERTED') {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.LEAD_ALREADY_CONVERTED,
        'Lead has already been converted to a client.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: LeadScope, lead: LeadRecord): void {
    if (lead.tenantId !== scope.tenantId || lead.workspaceId !== scope.workspaceId) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Lead does not belong to the requested workspace.',
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

  normalizeOptionalEmail(value: string | null | undefined): string | null | undefined {
    const normalized = this.normalizeOptionalString(value);
    if (normalized === undefined || normalized === null) {
      return normalized;
    }
    return normalized.toLowerCase();
  }

  private assertCompanyRequired(company: string): void {
    if (company.trim().length === 0) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.COMPANY_REQUIRED,
        'Lead company is required.',
      );
    }
  }

  private assertLeadScoreValid(leadScore: number): void {
    if (!Number.isInteger(leadScore) || leadScore < 0 || leadScore > 100) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_LEAD_SCORE,
        'Lead score must be an integer between 0 and 100.',
      );
    }
  }

  private assertValidStatus(status: LeadStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not a valid lead lifecycle state.`,
      );
    }
  }

  private assertStatusChangeableViaUpdate(status: LeadStatus): void {
    if (status === 'CONVERTED') {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.STATUS_CHANGE_REQUIRES_DEDICATED_ENDPOINT,
        'Use the convert endpoint to mark a lead as converted.',
      );
    }

    if (status === 'ARCHIVED') {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.STATUS_CHANGE_REQUIRES_DEDICATED_ENDPOINT,
        'Use the archive endpoint to archive a lead.',
      );
    }
  }

  private assertStatusTransition(from: LeadStatus, to: LeadStatus): void {
    if (from === to) {
      return;
    }

    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot transition lead status from "${from}" to "${to}".`,
      );
    }
  }

  private assertValidPriority(priority: LeadPriority): void {
    if (!VALID_PRIORITIES.includes(priority)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_PRIORITY,
        'Lead priority is invalid.',
      );
    }
  }

  private assertValidSource(source: LeadSource): void {
    if (!VALID_SOURCES.includes(source)) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.INVALID_SOURCE, 'Lead source is invalid.');
    }
  }

  private assertNonNegativeExpectedDealSize(value: number): void {
    if (!Number.isFinite(value) || value < 0) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_EXPECTED_DEAL_SIZE,
        'Expected deal size must be a non-negative number.',
      );
    }
  }

  private assertLeadIsActive(lead: LeadRecord): void {
    if (lead.deletedAt !== null || lead.status === 'ARCHIVED') {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.LEAD_ARCHIVED,
        'Lead is archived and cannot be modified.',
      );
    }
  }
}
