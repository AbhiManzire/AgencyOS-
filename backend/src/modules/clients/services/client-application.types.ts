import type { ClientSource, ClientStatus } from '@prisma/client';
import type {
  ArchiveValidationContext,
  ClientMembershipContext,
} from '../domain/client-domain.types';
import type {
  ClientListSortField,
  ClientListSortOrder,
  ClientRecord,
  ClientScope,
  ListClientsResult,
  WorkspaceOwnerOption,
} from '../repositories/client.repository.interface';

/** Actor and membership context supplied by the caller (not auth — orchestration only). */
export interface ClientApplicationContext {
  readonly actorUserId: string;
  readonly membership?: ClientMembershipContext;
  readonly archive?: ArchiveValidationContext;
}

export interface CreateClientCommand {
  readonly displayName: string;
  readonly slug?: string;
  readonly status?: ClientStatus;
  readonly legalName?: string | null;
  readonly clientCode?: string | null;
  readonly industry?: string | null;
  readonly website?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly currency?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
  readonly shippingAddressLine1?: string | null;
  readonly shippingAddressLine2?: string | null;
  readonly shippingCity?: string | null;
  readonly shippingStateRegion?: string | null;
  readonly shippingPostalCode?: string | null;
  readonly shippingCountryCode?: string | null;
  readonly ownerUserId?: string | null;
  readonly source?: ClientSource | null;
  readonly externalReferenceId?: string | null;
  readonly becameClientAt?: Date | null;
  /** Internal-only: allows creating ACTIVE clients (won-deal activation path). */
  readonly allowActiveClient?: boolean;
}

export interface UpdateClientCommand {
  readonly displayName?: string;
  readonly slug?: string;
  readonly status?: ClientStatus;
  readonly legalName?: string | null;
  readonly clientCode?: string | null;
  readonly industry?: string | null;
  readonly website?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly gstin?: string | null;
  readonly pan?: string | null;
  readonly currency?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
  readonly shippingAddressLine1?: string | null;
  readonly shippingAddressLine2?: string | null;
  readonly shippingCity?: string | null;
  readonly shippingStateRegion?: string | null;
  readonly shippingPostalCode?: string | null;
  readonly shippingCountryCode?: string | null;
  readonly ownerUserId?: string | null;
  readonly source?: ClientSource | null;
  readonly externalReferenceId?: string | null;
  readonly becameClientAt?: Date | null;
}

export interface RestoreClientCommand {
  readonly targetStatus?: ClientStatus;
}

export interface GetClientOptions {
  readonly includeArchived?: boolean;
}

export interface ListClientsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ClientStatus;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly q?: string;
  readonly ownerUserId?: string;
  readonly tagId?: string;
  readonly sortBy?: ClientListSortField;
  readonly sortOrder?: ClientListSortOrder;
}

export type { ClientRecord, ClientScope, ListClientsResult, WorkspaceOwnerOption };
