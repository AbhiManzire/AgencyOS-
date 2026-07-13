import type { ClientRenewalStatus, ClientRenewalType, Prisma } from '@prisma/client';
import type { ClientScope } from '../../repositories/client.repository.interface';

export const CLIENT_RENEWAL_REPOSITORY = Symbol('CLIENT_RENEWAL_REPOSITORY');

export type ClientRenewalTransactionClient = Prisma.TransactionClient;

export interface ClientRenewalRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly type: ClientRenewalType;
  readonly title: string;
  readonly description: string | null;
  readonly amount: number | null;
  readonly currency: string | null;
  readonly renewalDate: Date;
  readonly reminderDate: Date | null;
  readonly autoNotify: boolean;
  readonly status: ClientRenewalStatus;
  readonly reminderId: string | null;
  readonly lastNotifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateClientRenewalData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly type: ClientRenewalType;
  readonly title: string;
  readonly description?: string | null;
  readonly amount?: number | null;
  readonly currency?: string | null;
  readonly renewalDate: Date;
  readonly reminderDate?: Date | null;
  readonly autoNotify?: boolean;
  readonly status: ClientRenewalStatus;
  readonly reminderId?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateClientRenewalData {
  readonly type?: ClientRenewalType;
  readonly title?: string;
  readonly description?: string | null;
  readonly amount?: number | null;
  readonly currency?: string | null;
  readonly renewalDate?: Date;
  readonly reminderDate?: Date | null;
  readonly autoNotify?: boolean;
  readonly status?: ClientRenewalStatus;
  readonly reminderId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteClientRenewalData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId: string | null;
}

export interface ListClientRenewalsParams {
  readonly scope: ClientScope;
  readonly clientId: string;
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ClientRenewalStatus;
}

export interface ListClientRenewalsResult {
  readonly items: readonly ClientRenewalRecord[];
  readonly total: number;
}

export interface ClientRenewalRepository {
  create(
    data: CreateClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord>;
  update(
    scope: ClientScope,
    clientId: string,
    id: string,
    data: UpdateClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord | null>;
  findById(scope: ClientScope, clientId: string, id: string): Promise<ClientRenewalRecord | null>;
  list(params: ListClientRenewalsParams): Promise<ListClientRenewalsResult>;
  softDelete(
    scope: ClientScope,
    clientId: string,
    id: string,
    data: SoftDeleteClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord | null>;
}
