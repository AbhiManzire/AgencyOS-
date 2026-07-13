import { Injectable } from '@nestjs/common';
import type { ClientContact } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ClientContactRecord,
  ClientContactRepository,
  ClientContactScope,
  CreateClientContactData,
  SoftDeleteClientContactData,
  UnsetPrimaryContactsData,
  UpdateClientContactData,
} from './client-contact.repository.interface';

@Injectable()
export class PrismaClientContactRepository implements ClientContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientContactData): Promise<ClientContactRecord> {
    const contact = await this.prisma.clientContact.create({ data });
    return toClientContactRecord(contact);
  }

  async update(
    scope: ClientContactScope,
    id: string,
    data: UpdateClientContactData,
  ): Promise<ClientContactRecord | null> {
    const result = await this.prisma.clientContact.updateMany({
      where: activeContactWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(scope: ClientContactScope, id: string): Promise<ClientContactRecord | null> {
    const contact = await this.prisma.clientContact.findFirst({
      where: activeContactWhere(scope, id),
    });

    return contact ? toClientContactRecord(contact) : null;
  }

  async listByClient(scope: ClientContactScope): Promise<readonly ClientContactRecord[]> {
    const contacts = await this.prisma.clientContact.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: scope.clientId,
        deletedAt: null,
      },
      orderBy: [{ isPrimary: 'desc' }, { firstName: 'asc' }, { lastName: 'asc' }],
    });

    return contacts.map(toClientContactRecord);
  }

  async softDelete(
    scope: ClientContactScope,
    id: string,
    data: SoftDeleteClientContactData,
  ): Promise<ClientContactRecord | null> {
    const result = await this.prisma.clientContact.updateMany({
      where: activeContactWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const contact = await this.prisma.clientContact.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: scope.clientId,
      },
    });

    return contact ? toClientContactRecord(contact) : null;
  }

  async unsetPrimaryForClient(
    scope: ClientContactScope,
    data: UnsetPrimaryContactsData,
    excludeContactId?: string,
  ): Promise<void> {
    await this.prisma.clientContact.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: scope.clientId,
        deletedAt: null,
        isPrimary: true,
        ...(excludeContactId ? { id: { not: excludeContactId } } : {}),
      },
      data: {
        isPrimary: false,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
  }

  async countPrimaryForClient(
    scope: ClientContactScope,
    excludeContactId?: string,
  ): Promise<number> {
    return this.prisma.clientContact.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId: scope.clientId,
        deletedAt: null,
        isPrimary: true,
        ...(excludeContactId ? { id: { not: excludeContactId } } : {}),
      },
    });
  }
}

function activeContactWhere(scope: ClientContactScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    clientId: scope.clientId,
    deletedAt: null,
  };
}

function toClientContactRecord(contact: ClientContact): ClientContactRecord {
  return {
    id: contact.id,
    tenantId: contact.tenantId,
    workspaceId: contact.workspaceId,
    clientId: contact.clientId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    role: contact.role,
    jobTitle: contact.jobTitle,
    department: contact.department,
    email: contact.email,
    mobile: contact.mobile,
    phone: contact.phone,
    isPrimary: contact.isPrimary,
    isDecisionMaker: contact.isDecisionMaker,
    isFinance: contact.isFinance,
    isTechnical: contact.isTechnical,
    isProcurement: contact.isProcurement,
    status: contact.status,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    createdByUserId: contact.createdByUserId,
    updatedByUserId: contact.updatedByUserId,
    deletedAt: contact.deletedAt,
    deletedByUserId: contact.deletedByUserId,
  };
}
