import type { ClientStatus } from '@prisma/client';
import type {
  ClientRecord,
  ClientRepository,
  ClientScope,
} from '../repositories/client.repository.interface';
import { CLIENT_DOMAIN_ERROR_CODES, ClientDomainError } from './client-domain.errors';
import {
  CLIENT_CREATABLE_STATUSES,
  CLIENT_RESTORABLE_STATUSES,
  CLIENT_SOFT_DELETE_RETENTION_DAYS,
  type ArchiveValidationContext,
  type ClientMembershipContext,
  type CreateClientValidationInput,
  type RestoreClientValidationInput,
  type UpdateClientValidationInput,
} from './client-domain.types';

const STATUS_TRANSITIONS: Readonly<Record<ClientStatus, readonly ClientStatus[]>> = {
  PROSPECT: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
  ACTIVE: ['INACTIVE', 'ARCHIVED'],
  INACTIVE: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['ACTIVE', 'INACTIVE'],
};

/** Workspace-unique sequential client code prefix. */
export const CLIENT_CODE_PREFIX = 'CL-';
const CLIENT_CODE_PAD_LENGTH = 6;

/**
 * Pure domain service for client business rules.
 * Framework-independent — no HTTP or NestJS dependencies.
 */
export class ClientDomainService {
  constructor(private readonly clientRepository: ClientRepository) {}

  async validateCreate(
    scope: ClientScope,
    input: CreateClientValidationInput,
    membership?: ClientMembershipContext,
  ): Promise<void> {
    this.assertScopeAlignment(scope, input.tenantId, input.workspaceId);
    this.assertDisplayNameRequired(input.displayName);

    const status = input.status ?? 'PROSPECT';
    this.assertCreatableStatus(status);
    this.assertOptionalFormats(
      input.website,
      input.email,
      input.countryCode,
      input.shippingCountryCode,
      input.gstin,
      input.pan,
      input.currency,
      input.phone,
    );
    this.assertOwnerIsWorkspaceMember(input.ownerUserId, membership);

    await this.assertDisplayNameAvailable(scope, input.displayName);

    if (input.slug !== undefined) {
      if (await this.isSlugTaken(scope, input.slug)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.SLUG_NOT_UNIQUE,
          'Slug is already in use by another active client in this workspace.',
        );
      }
    } else {
      await this.ensureUniqueSlug(scope, generateSlug(input.displayName));
    }
  }

  async validateUpdate(
    scope: ClientScope,
    client: ClientRecord,
    input: UpdateClientValidationInput,
    membership?: ClientMembershipContext,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, client);
    this.assertClientIsActive(client);

    if (input.displayName !== undefined) {
      this.assertDisplayNameRequired(input.displayName);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusTransition(client.status, input.status);
    }

    this.assertOptionalFormats(
      input.website,
      input.email,
      input.countryCode,
      input.shippingCountryCode,
      input.gstin,
      input.pan,
      input.currency,
      input.phone,
    );

    if (input.ownerUserId !== undefined) {
      this.assertOwnerIsWorkspaceMember(input.ownerUserId, membership);
    }

    if (input.displayName !== undefined) {
      await this.assertDisplayNameAvailable(scope, input.displayName, client.id);
    }

    // Client codes are system-generated and immutable after create.
    if (input.clientCode !== undefined && input.clientCode !== client.clientCode) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_CODE_IMMUTABLE,
        'Client code is system-generated and cannot be changed.',
      );
    }

    if (input.slug !== undefined) {
      if (await this.isSlugTaken(scope, input.slug, client.id)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.SLUG_NOT_UNIQUE,
          'Slug is already in use by another active client in this workspace.',
        );
      }
    } else if (input.displayName !== undefined) {
      await this.ensureUniqueSlug(scope, generateSlug(input.displayName), client.id);
    }
  }

  validateArchive(
    scope: ClientScope,
    client: ClientRecord,
    context?: ArchiveValidationContext,
  ): void {
    this.ensureWorkspaceOwnership(scope, client);
    this.assertClientIsActive(client);
    this.assertArchiveBlockers(context);

    if (client.status !== 'ARCHIVED') {
      this.assertStatusTransition(client.status, 'ARCHIVED');
    }
  }

  async validateRestore(
    scope: ClientScope,
    client: ClientRecord,
    input: RestoreClientValidationInput = {},
    membership?: ClientMembershipContext,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, client);
    this.assertClientIsArchived(client);

    const now = input.now ?? new Date();
    this.assertWithinRetentionWindow(client.deletedAt, now);

    const targetStatus = input.targetStatus ?? 'ACTIVE';
    this.assertRestorableStatus(targetStatus);
    this.assertStatusTransition('ARCHIVED', targetStatus);
    this.assertOwnerIsWorkspaceMember(client.ownerUserId, membership);

    await this.assertDisplayNameAvailable(scope, client.displayName, client.id);
  }

  generateSlug(displayName: string): string {
    return generateSlug(displayName);
  }

  /** Formats a sequential workspace client code as CL-000001. */
  formatClientCode(sequence: number): string {
    if (!Number.isInteger(sequence) || sequence < 1) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_CODE_NOT_UNIQUE,
        'Client code sequence must be a positive integer.',
      );
    }

    return `${CLIENT_CODE_PREFIX}${String(sequence).padStart(CLIENT_CODE_PAD_LENGTH, '0')}`;
  }

  async ensureUniqueSlug(
    scope: ClientScope,
    baseSlug: string,
    excludeClientId?: string,
  ): Promise<string> {
    const normalizedBase = normalizeSlug(baseSlug);
    let candidate = normalizedBase;
    let suffix = 2;

    while (await this.isSlugTaken(scope, candidate, excludeClientId)) {
      candidate = `${normalizedBase}-${String(suffix)}`;
      suffix += 1;
    }

    return candidate;
  }

  ensureWorkspaceOwnership(scope: ClientScope, client: ClientRecord): void {
    if (client.tenantId !== scope.tenantId || client.workspaceId !== scope.workspaceId) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Client does not belong to the requested workspace.',
      );
    }
  }

  private assertScopeAlignment(scope: ClientScope, tenantId: string, workspaceId: string): void {
    if (scope.tenantId !== tenantId || scope.workspaceId !== workspaceId) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.TENANT_SCOPE_MISMATCH,
        'Client data must match the active tenant and workspace scope.',
      );
    }
  }

  private assertDisplayNameRequired(displayName: string): void {
    if (displayName.trim().length === 0) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.DISPLAY_NAME_REQUIRED,
        'Display name is required.',
      );
    }
  }

  private assertCreatableStatus(status: ClientStatus): void {
    if (!CLIENT_CREATABLE_STATUSES.includes(status)) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when creating a client.`,
      );
    }
  }

  private assertValidStatus(status: ClientStatus): void {
    if (!isClientStatus(status)) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${String(status)}" is not a valid client lifecycle state.`,
      );
    }
  }

  private assertRestorableStatus(status: ClientStatus): void {
    if (!CLIENT_RESTORABLE_STATUSES.includes(status)) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when restoring a client.`,
      );
    }
  }

  private assertStatusTransition(from: ClientStatus, to: ClientStatus): void {
    if (from === to) {
      return;
    }

    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot transition client status from "${from}" to "${to}".`,
      );
    }
  }

  private assertOptionalFormats(
    website?: string | null,
    email?: string | null,
    countryCode?: string | null,
    shippingCountryCode?: string | null,
    gstin?: string | null,
    pan?: string | null,
    currency?: string | null,
    phone?: string | null,
  ): void {
    if (website !== undefined && website !== null && website.trim().length > 0) {
      if (!isValidWebsite(website)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_WEBSITE,
          'Website must be a valid URL.',
        );
      }
    }

    if (email !== undefined && email !== null && email.trim().length > 0) {
      if (!isValidEmail(email)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_EMAIL,
          'Email must be a valid email address.',
        );
      }
    }

    if (phone !== undefined && phone !== null && phone.trim().length > 0) {
      if (!isValidPhone(phone)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_PHONE,
          'Phone must contain 7 to 15 digits only.',
        );
      }
    }

    if (countryCode !== undefined && countryCode !== null && countryCode.trim().length > 0) {
      if (!isValidCountryCode(countryCode)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_COUNTRY_CODE,
          'Country code must be a valid ISO 3166-1 alpha-2 code.',
        );
      }
    }

    if (
      shippingCountryCode !== undefined &&
      shippingCountryCode !== null &&
      shippingCountryCode.trim().length > 0
    ) {
      if (!isValidCountryCode(shippingCountryCode)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_COUNTRY_CODE,
          'Shipping country code must be a valid ISO 3166-1 alpha-2 code.',
        );
      }
    }

    if (gstin !== undefined && gstin !== null && gstin.trim().length > 0) {
      if (!isValidGstin(gstin)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_GSTIN,
          'GSTIN must be a valid 15-character Indian GSTIN.',
        );
      }
    }

    if (pan !== undefined && pan !== null && pan.trim().length > 0) {
      if (!isValidPan(pan)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_PAN,
          'PAN must be a valid 10-character PAN.',
        );
      }
    }

    if (currency !== undefined && currency !== null && currency.trim().length > 0) {
      if (!isValidCurrency(currency)) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.INVALID_CURRENCY,
          'Currency must be a 3-letter ISO code.',
        );
      }
    }
  }

  private async assertClientCodeAvailable(
    scope: ClientScope,
    clientCode: string | null | undefined,
    excludeClientId?: string,
  ): Promise<void> {
    if (clientCode === undefined || clientCode === null || clientCode.trim().length === 0) {
      return;
    }

    const existing = await this.clientRepository.findByClientCode(scope, clientCode.trim());
    if (existing !== null && existing.id !== excludeClientId) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_CODE_NOT_UNIQUE,
        'Client code is already in use by another active client in this workspace.',
      );
    }
  }

  private assertOwnerIsWorkspaceMember(
    ownerUserId: string | null | undefined,
    membership?: ClientMembershipContext,
  ): void {
    if (ownerUserId === undefined || ownerUserId === null || ownerUserId.trim().length === 0) {
      return;
    }

    if (!membership?.isWorkspaceMember(ownerUserId)) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.OWNER_NOT_WORKSPACE_MEMBER,
        'Owner must be an active member of the workspace.',
      );
    }
  }

  private assertClientIsActive(client: ClientRecord): void {
    if (client.deletedAt !== null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED,
        'Client is archived and cannot be modified.',
      );
    }
  }

  private assertClientIsArchived(client: ClientRecord): void {
    if (client.deletedAt === null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_ARCHIVED,
        'Client is not archived.',
      );
    }
  }

  private assertWithinRetentionWindow(deletedAt: Date | null, now: Date): void {
    if (deletedAt === null) {
      return;
    }

    const retentionEndsAt = new Date(deletedAt);
    retentionEndsAt.setUTCDate(retentionEndsAt.getUTCDate() + CLIENT_SOFT_DELETE_RETENTION_DAYS);

    if (now.getTime() > retentionEndsAt.getTime()) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.RETENTION_WINDOW_EXPIRED,
        'Client can no longer be restored because the retention window has expired.',
      );
    }
  }

  private assertArchiveBlockers(context?: ArchiveValidationContext): void {
    if (context?.hasActiveProjects) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_ACTIVE_PROJECTS,
        'Client cannot be archived while active projects exist.',
      );
    }

    if (context?.hasOpenUnpaidInvoices) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_OPEN_INVOICES,
        'Client cannot be archived while open unpaid invoices exist.',
      );
    }

    if (context?.hasRunningCampaigns) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.ARCHIVE_BLOCKED_RUNNING_CAMPAIGNS,
        'Client cannot be archived while running campaigns exist.',
      );
    }
  }

  private async assertDisplayNameAvailable(
    scope: ClientScope,
    displayName: string,
    excludeClientId?: string,
  ): Promise<void> {
    const normalized = normalizeDisplayName(displayName);
    let skip = 0;
    const take = 100;

    for (;;) {
      // Include archived: DB unique on displayName is not soft-delete-aware.
      const { items, total } = await this.clientRepository.list({
        scope,
        skip,
        take,
        includeArchived: true,
      });

      for (const client of items) {
        if (client.id === excludeClientId) {
          continue;
        }

        if (normalizeDisplayName(client.displayName) === normalized) {
          throw new ClientDomainError(
            CLIENT_DOMAIN_ERROR_CODES.DISPLAY_NAME_NOT_UNIQUE,
            'Display name is already in use by another client in this workspace.',
          );
        }
      }

      skip += take;
      if (skip >= total) {
        break;
      }
    }
  }

  private async isSlugTaken(
    scope: ClientScope,
    slug: string,
    excludeClientId?: string,
  ): Promise<boolean> {
    const existing = await this.clientRepository.findBySlug(scope, slug);
    return existing !== null && existing.id !== excludeClientId;
  }
}

export function generateSlug(displayName: string): string {
  const slug = displayName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

  return slug.length > 0 ? slug : 'client';
}

function normalizeSlug(slug: string): string {
  return generateSlug(slug);
}

function normalizeDisplayName(displayName: string): string {
  return displayName.trim().toLowerCase();
}

function isClientStatus(value: string): value is ClientStatus {
  return value === 'PROSPECT' || value === 'ACTIVE' || value === 'INACTIVE' || value === 'ARCHIVED';
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidWebsite(website: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    const url = new URL(withProtocol);
    return url.hostname.length > 0;
  } catch {
    return false;
  }
}

function isValidCountryCode(countryCode: string): boolean {
  return /^[A-Z]{2}$/.test(countryCode.trim().toUpperCase());
}

function isValidGstin(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(gstin.trim());
}

function isValidPan(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(pan.trim());
}

function isValidCurrency(currency: string): boolean {
  return /^[A-Z]{3}$/i.test(currency.trim());
}

function isValidPhone(phone: string): boolean {
  return /^\d{7,15}$/.test(phone.trim());
}
