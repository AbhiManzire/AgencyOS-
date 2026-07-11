import type { ClientSource, ClientStatus, Prisma } from '@prisma/client';

/** Tenant and workspace scope required on every client repository operation. */
export interface ClientScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

/** Optional interactive-transaction client for atomic writes. */
export type ClientTransactionClient = Prisma.TransactionClient;

/** Persistence input for creating a client record. */
export interface CreateClientData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly slug: string;
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

/** Persistence input for updating a client record. */
export interface UpdateClientData {
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
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface RestoreClientData {
  readonly status: ClientStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface FindByIdOptions {
  readonly includeArchived?: boolean;
}

/** Persistence input for archiving (soft-deleting) a client record. */
export interface ArchiveClientData {
  readonly status: ClientStatus;
  readonly deletedAt: Date;
  readonly deletedByUserId: string;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export type ClientListSortField = 'createdAt' | 'displayName' | 'status' | 'email' | 'legalName';

export type ClientListSortOrder = 'asc' | 'desc';

/** Query parameters for listing clients within a workspace. */
export interface ListClientsParams {
  readonly scope: ClientScope;
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

/** Paginated list result. */
export interface ListClientsResult {
  readonly items: readonly ClientRecord[];
  readonly total: number;
}

/** Client row returned from persistence. */
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
  readonly source: ClientSource | null;
  readonly externalReferenceId: string | null;
  readonly becameClientAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface WorkspaceOwnerOption {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface ClientRepository {
  create(data: CreateClientData, tx?: ClientTransactionClient): Promise<ClientRecord>;
  update(
    scope: ClientScope,
    id: string,
    data: UpdateClientData,
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null>;
  findById(scope: ClientScope, id: string, options?: FindByIdOptions): Promise<ClientRecord | null>;
  findBySlug(scope: ClientScope, slug: string): Promise<ClientRecord | null>;
  findByClientCode(scope: ClientScope, clientCode: string): Promise<ClientRecord | null>;
  list(params: ListClientsParams): Promise<ListClientsResult>;
  archive(
    scope: ClientScope,
    id: string,
    data: ArchiveClientData,
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null>;
  restore(
    scope: ClientScope,
    id: string,
    data: RestoreClientData,
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null>;
  listWorkspaceOwners(scope: ClientScope): Promise<readonly WorkspaceOwnerOption[]>;
  isWorkspaceMember(scope: ClientScope, userId: string): Promise<boolean>;
  countActiveProjects(scope: ClientScope, clientId: string): Promise<number>;
  countOpenUnpaidInvoices(scope: ClientScope, clientId: string): Promise<number>;
}

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');
