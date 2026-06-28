import type { ClientSource, ClientStatus } from '@prisma/client';

/** Tenant and workspace scope required on every client repository operation. */
export interface ClientScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

/** Persistence input for creating a client record. */
export interface CreateClientData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly displayName: string;
  readonly slug: string;
  readonly status?: ClientStatus;
  readonly legalName?: string | null;
  readonly industry?: string | null;
  readonly website?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
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
  readonly industry?: string | null;
  readonly website?: string | null;
  readonly phone?: string | null;
  readonly email?: string | null;
  readonly addressLine1?: string | null;
  readonly addressLine2?: string | null;
  readonly city?: string | null;
  readonly stateRegion?: string | null;
  readonly postalCode?: string | null;
  readonly countryCode?: string | null;
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

/** Query parameters for listing clients within a workspace. */
export interface ListClientsParams {
  readonly scope: ClientScope;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ClientStatus;
  readonly includeArchived?: boolean;
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
  readonly industry: string | null;
  readonly website: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly city: string | null;
  readonly stateRegion: string | null;
  readonly postalCode: string | null;
  readonly countryCode: string | null;
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

export interface ClientRepository {
  create(data: CreateClientData): Promise<ClientRecord>;
  update(scope: ClientScope, id: string, data: UpdateClientData): Promise<ClientRecord | null>;
  findById(scope: ClientScope, id: string, options?: FindByIdOptions): Promise<ClientRecord | null>;
  findBySlug(scope: ClientScope, slug: string): Promise<ClientRecord | null>;
  list(params: ListClientsParams): Promise<ListClientsResult>;
  archive(scope: ClientScope, id: string, data: ArchiveClientData): Promise<ClientRecord | null>;
  restore(scope: ClientScope, id: string, data: RestoreClientData): Promise<ClientRecord | null>;
}

export const CLIENT_REPOSITORY = Symbol('CLIENT_REPOSITORY');
