import type { ClientStatus, ClientSource } from '@/features/clients/types';

/** Request body for POST /clients — mirrors backend CreateClientDto (MVP fields). */
export interface CreateClientPayload {
  readonly displayName: string;
  readonly legalName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly website?: string;
  readonly status?: ClientStatus;
  readonly ownerUserId?: string;
  readonly source?: ClientSource;
}

/** Request body for PATCH /clients/:id — mirrors backend UpdateClientDto (MVP fields). */
export interface UpdateClientPayload {
  readonly displayName: string;
  readonly status: ClientStatus;
  readonly legalName?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly ownerUserId?: string | null;
  readonly source?: ClientSource | null;
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
  readonly status?: ClientStatus;
  readonly includeArchived?: boolean;
}

export interface RestoreClientPayload {
  readonly targetStatus?: ClientStatus;
}

export interface ListClientsResult {
  readonly items: readonly ClientRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}
