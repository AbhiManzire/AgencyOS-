import type { ClientSource, ClientStatus } from '@prisma/client';
import type { ClientRecord, ClientScope } from '../repositories/client.repository.interface';

/** Soft-delete retention window per blueprint/modules/clients/database.md Tier 6. */
export const CLIENT_SOFT_DELETE_RETENTION_DAYS = 30;

/** Allowed initial statuses when creating a client. */
export const CLIENT_CREATABLE_STATUSES: readonly ClientStatus[] = ['PROSPECT', 'ACTIVE'];

/** Allowed target statuses when restoring an archived client. */
export const CLIENT_RESTORABLE_STATUSES: readonly ClientStatus[] = ['ACTIVE', 'INACTIVE'];

export interface CreateClientValidationInput {
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly slug?: string;
  readonly status?: ClientStatus;
  readonly clientCode?: string | null;
  readonly website?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly currency?: string | null;
  readonly countryCode?: string | null;
  readonly shippingCountryCode?: string | null;
  readonly ownerUserId?: string | null;
  readonly externalReferenceId?: string | null;
  readonly source?: ClientSource | null;
}

export interface UpdateClientValidationInput {
  readonly displayName?: string;
  readonly slug?: string;
  readonly status?: ClientStatus;
  readonly clientCode?: string | null;
  readonly website?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly currency?: string | null;
  readonly countryCode?: string | null;
  readonly shippingCountryCode?: string | null;
  readonly ownerUserId?: string | null;
  readonly externalReferenceId?: string | null;
  readonly source?: ClientSource | null;
}

/** Resolves whether a user belongs to the active workspace. */
export interface ClientMembershipContext {
  readonly isWorkspaceMember: (userId: string) => boolean;
}

/** Downstream module signals supplied by the application layer before archive. */
export interface ArchiveValidationContext {
  readonly hasActiveProjects?: boolean;
  readonly hasOpenUnpaidInvoices?: boolean;
  readonly hasRunningCampaigns?: boolean;
}

export interface RestoreClientValidationInput {
  readonly targetStatus?: ClientStatus;
  readonly now?: Date;
}

export type { ClientRecord, ClientScope };
