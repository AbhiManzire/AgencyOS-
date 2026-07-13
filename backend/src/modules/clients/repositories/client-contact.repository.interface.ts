import type { ClientContactStatus } from '@prisma/client';
import type { ClientScope } from './client.repository.interface';

export const CLIENT_CONTACT_REPOSITORY = Symbol('CLIENT_CONTACT_REPOSITORY');

/** Tenant, workspace, and client scope required on every contact repository operation. */
export interface ClientContactScope extends ClientScope {
  readonly clientId: string;
}

export interface ClientContactRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly firstName: string;
  readonly lastName: string | null;
  readonly role: string | null;
  readonly jobTitle: string | null;
  readonly department: string | null;
  readonly email: string | null;
  readonly mobile: string | null;
  readonly phone: string | null;
  readonly isPrimary: boolean;
  readonly isDecisionMaker: boolean;
  readonly isFinance: boolean;
  readonly isTechnical: boolean;
  readonly isProcurement: boolean;
  readonly status: ClientContactStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateClientContactData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly firstName: string;
  readonly lastName?: string | null;
  readonly role?: string | null;
  readonly jobTitle?: string | null;
  readonly department?: string | null;
  readonly email?: string | null;
  readonly mobile?: string | null;
  readonly phone?: string | null;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly isFinance?: boolean;
  readonly isTechnical?: boolean;
  readonly isProcurement?: boolean;
  readonly status?: ClientContactStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateClientContactData {
  readonly firstName?: string;
  readonly lastName?: string | null;
  readonly role?: string | null;
  readonly jobTitle?: string | null;
  readonly department?: string | null;
  readonly email?: string | null;
  readonly mobile?: string | null;
  readonly phone?: string | null;
  readonly isPrimary?: boolean;
  readonly isDecisionMaker?: boolean;
  readonly isFinance?: boolean;
  readonly isTechnical?: boolean;
  readonly isProcurement?: boolean;
  readonly status?: ClientContactStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteClientContactData {
  readonly deletedAt: Date;
  readonly deletedByUserId: string;
  readonly updatedAt: Date;
  readonly updatedByUserId: string;
}

export interface UnsetPrimaryContactsData {
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ClientContactRepository {
  create(data: CreateClientContactData): Promise<ClientContactRecord>;
  update(
    scope: ClientContactScope,
    id: string,
    data: UpdateClientContactData,
  ): Promise<ClientContactRecord | null>;
  findById(scope: ClientContactScope, id: string): Promise<ClientContactRecord | null>;
  listByClient(scope: ClientContactScope): Promise<readonly ClientContactRecord[]>;
  softDelete(
    scope: ClientContactScope,
    id: string,
    data: SoftDeleteClientContactData,
  ): Promise<ClientContactRecord | null>;
  unsetPrimaryForClient(
    scope: ClientContactScope,
    data: UnsetPrimaryContactsData,
    excludeContactId?: string,
  ): Promise<void>;
  countPrimaryForClient(scope: ClientContactScope, excludeContactId?: string): Promise<number>;
}
