import type {
  ClientServerSortField,
  ClientSource,
  ClientStatus,
  SortDirection,
  WorkspaceOwnerOption,
} from '@/features/clients/types';

/** Creatable statuses for POST /clients. */
export type CreateClientStatus = Extract<ClientStatus, 'PROSPECT' | 'ACTIVE'>;

/** Request body for POST /clients — mirrors backend CreateClientDto. */
export interface CreateClientPayload {
  readonly displayName: string;
  readonly legalName?: string;
  readonly clientCode?: string;
  readonly industry?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly status?: CreateClientStatus;
  readonly ownerUserId?: string;
  readonly source?: ClientSource;
  readonly gstin?: string;
  readonly pan?: string;
  readonly currency?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly stateRegion?: string;
  readonly postalCode?: string;
  readonly countryCode?: string;
  readonly shippingAddressLine1?: string;
  readonly shippingAddressLine2?: string;
  readonly shippingCity?: string;
  readonly shippingStateRegion?: string;
  readonly shippingPostalCode?: string;
  readonly shippingCountryCode?: string;
}

/** Request body for PATCH /clients/:id — mirrors backend UpdateClientDto. */
export interface UpdateClientPayload {
  readonly displayName: string;
  readonly status: Exclude<ClientStatus, 'ARCHIVED'>;
  readonly legalName?: string | null;
  readonly clientCode?: string | null;
  readonly industry?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly ownerUserId?: string | null;
  readonly source?: ClientSource | null;
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
}

/** Client row returned by GET /clients — mirrors backend ClientRecord. */
export interface ClientRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly slug: string;
  readonly status: ClientStatus;
  readonly legalName: string | null;
  readonly clientCode: string | null;
  readonly industry: string | null;
  readonly website: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly gstin: string | null;
  readonly pan: string | null;
  readonly currency: string | null;
  readonly paymentTermsDays?: number | null;
  readonly creditLimit?: number | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly stateRegion: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
  readonly shippingAddressLine1: string | null;
  readonly shippingAddressLine2: string | null;
  readonly shippingCity: string | null;
  readonly shippingStateRegion: string | null;
  readonly shippingPostalCode: string | null;
  readonly shippingCountryCode: string | null;
  readonly ownerUserId: string | null;
  readonly source: string | null;
  readonly externalReferenceId: string | null;
  readonly becameClientAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListClientsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: Exclude<ClientStatus, 'ARCHIVED'>;
  readonly includeArchived?: boolean;
  readonly archivedOnly?: boolean;
  readonly q?: string;
  readonly ownerUserId?: string;
  readonly tagId?: string;
  readonly sortBy?: ClientServerSortField;
  readonly sortOrder?: SortDirection;
}

export interface GetClientParams {
  readonly includeArchived?: boolean;
}

export interface RestoreClientPayload {
  readonly targetStatus?: Exclude<ClientStatus, 'ARCHIVED'>;
}

export interface ListClientsResult {
  readonly items: readonly ClientRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export type { WorkspaceOwnerOption };
