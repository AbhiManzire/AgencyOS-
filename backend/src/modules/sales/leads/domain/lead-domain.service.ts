import type { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import type { LeadRecord, LeadScope } from '../repositories/lead.repository.interface';
import { LEAD_DOMAIN_ERROR_CODES, LeadDomainError } from './lead-domain.errors';
import {
  LEAD_CREATABLE_STATUSES,
  LEAD_RESTORABLE_STATUSES,
  type CreateLeadValidationInput,
  type LeadScoreInput,
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
];

const STATUS_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  NEW: ['CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'ARCHIVED'],
  CONTACTED: ['QUALIFIED', 'DISQUALIFIED', 'ARCHIVED'],
  QUALIFIED: ['CONTACTED', 'DISQUALIFIED', 'CONVERTED', 'ARCHIVED'],
  DISQUALIFIED: ['NEW', 'CONTACTED', 'ARCHIVED'],
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

    if (this.shouldRequireContactDetails(input.source)) {
      this.assertContactPersonRequired(input.contactPerson);
      this.assertEmailRequired(input.email);
      this.assertPhoneRequired(input.phone);
    }

    if (hasNonEmptyText(input.email)) {
      if (!isValidEmail(input.email)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_EMAIL,
          'Email must be a valid email address.',
        );
      }
    }

    if (hasNonEmptyText(input.phone)) {
      if (!isValidPhone(input.phone)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_PHONE,
          'Phone must contain 7 to 15 digits only.',
        );
      }
    }

    if (input.source !== undefined && input.source !== null) {
      this.assertValidSource(input.source);
    }

    if (input.website !== undefined && input.website !== null && input.website.trim().length > 0) {
      this.assertValidWebsite(input.website);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertCreatableStatus(input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.expectedDealSize !== undefined && input.expectedDealSize !== null) {
      this.assertPositiveExpectedDealSize(input.expectedDealSize);
    }
  }

  /**
   * Import rows require company only. Optional contact/email/phone/website
   * are format-checked when present.
   */
  validateImportRow(input: CreateLeadValidationInput): void {
    this.assertCompanyRequired(input.company);

    if (hasNonEmptyText(input.email)) {
      if (!isValidEmail(input.email)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_EMAIL,
          'Email must be a valid email address.',
        );
      }
    }

    if (hasNonEmptyText(input.phone)) {
      if (!isValidPhone(input.phone)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_PHONE,
          'Phone must contain 7 to 15 digits only.',
        );
      }
    }

    if (input.source !== undefined && input.source !== null) {
      this.assertValidSource(input.source);
    }

    if (input.website !== undefined && input.website !== null && input.website.trim().length > 0) {
      this.assertValidWebsite(input.website);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertCreatableStatus(input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.expectedDealSize !== undefined && input.expectedDealSize !== null) {
      this.assertPositiveExpectedDealSize(input.expectedDealSize);
    }
  }

  validateUpdate(lead: LeadRecord, input: UpdateLeadValidationInput): void {
    this.assertLeadIsActive(lead);

    if (input.company !== undefined) {
      this.assertCompanyRequired(input.company);
    }

    if (input.contactPerson !== undefined && input.contactPerson !== null) {
      if (input.contactPerson.trim().length === 0) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.CONTACT_PERSON_REQUIRED,
          'Contact person cannot be empty.',
        );
      }
    }

    if (input.email !== undefined && input.email !== null) {
      if (input.email.trim().length === 0) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.EMAIL_REQUIRED, 'Email cannot be empty.');
      }
      if (!isValidEmail(input.email)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_EMAIL,
          'Email must be a valid email address.',
        );
      }
    }

    if (input.phone !== undefined && input.phone !== null) {
      if (input.phone.trim().length === 0) {
        throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.PHONE_REQUIRED, 'Phone cannot be empty.');
      }
      if (!isValidPhone(input.phone)) {
        throw new LeadDomainError(
          LEAD_DOMAIN_ERROR_CODES.INVALID_PHONE,
          'Phone must contain 7 to 15 digits only.',
        );
      }
    }

    if (input.source !== undefined && input.source !== null) {
      this.assertValidSource(input.source);
    }

    if (input.website !== undefined && input.website !== null && input.website.trim().length > 0) {
      this.assertValidWebsite(input.website);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusChangeableViaUpdate(input.status);
      this.assertStatusTransition(lead.status, input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.expectedDealSize !== undefined && input.expectedDealSize !== null) {
      this.assertPositiveExpectedDealSize(input.expectedDealSize);
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

  /**
   * Auto lead score (0–100):
   * decision maker +20, budget known +20, timeline +20,
   * website +10, valid email +10, valid phone +10, company +10.
   */
  calculateLeadScore(input: LeadScoreInput): number {
    let score = 0;

    if (hasNonEmptyText(input.decisionMaker)) {
      score += 20;
    }
    if (hasNonEmptyText(input.budgetNotes)) {
      score += 20;
    }
    if (hasNonEmptyText(input.timeline)) {
      score += 20;
    }
    if (hasNonEmptyText(input.website) && isValidWebsite(input.website.trim())) {
      score += 10;
    }
    if (hasNonEmptyText(input.email) && isValidEmail(input.email.trim())) {
      score += 10;
    }
    if (hasNonEmptyText(input.phone) && isValidPhone(input.phone.trim())) {
      score += 10;
    }
    if (hasNonEmptyText(input.company)) {
      score += 10;
    }

    return score;
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

  private assertCompanyRequired(company: string | null | undefined): void {
    if (company === null || company === undefined || company.trim().length === 0) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.COMPANY_REQUIRED,
        'Lead company is required.',
      );
    }
  }

  private shouldRequireContactDetails(source?: LeadSource | null): boolean {
    if (source === undefined || source === null) {
      return true;
    }
    return source === 'MANUAL' || source === 'CALL' || source === 'EMAIL' || source === 'REFERRAL';
  }

  private assertContactPersonRequired(contactPerson: string | null | undefined): void {
    if (
      contactPerson === null ||
      contactPerson === undefined ||
      contactPerson.trim().length === 0
    ) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.CONTACT_PERSON_REQUIRED,
        'Contact person is required.',
      );
    }
  }

  private assertEmailRequired(email: string | null | undefined): void {
    if (email === null || email === undefined || email.trim().length === 0) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.EMAIL_REQUIRED, 'Email is required.');
    }
  }

  private assertPhoneRequired(phone: string | null | undefined): void {
    if (phone === null || phone === undefined || phone.trim().length === 0) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.PHONE_REQUIRED, 'Phone is required.');
    }
  }

  private assertValidWebsite(website: string): void {
    if (!isValidWebsite(website)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_WEBSITE,
        'Website must be a valid URL.',
      );
    }
  }

  private assertCreatableStatus(status: LeadStatus): void {
    if (!LEAD_CREATABLE_STATUSES.includes(status)) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when creating a lead.`,
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

  private assertPositiveExpectedDealSize(value: number): void {
    if (!Number.isFinite(value) || value <= 0) {
      throw new LeadDomainError(
        LEAD_DOMAIN_ERROR_CODES.INVALID_EXPECTED_DEAL_SIZE,
        'Expected deal size must be a positive number.',
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

function hasNonEmptyText(value: string | null | undefined): value is string {
  return value !== null && value !== undefined && value.trim().length > 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPhone(phone: string): boolean {
  return /^\d{7,15}$/.test(phone.trim());
}

function isValidWebsite(website: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    const url = new URL(withProtocol);
    return url.hostname.length > 0 && url.hostname.includes('.');
  } catch {
    return false;
  }
}
