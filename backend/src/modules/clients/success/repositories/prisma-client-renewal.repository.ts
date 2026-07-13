import { Injectable } from '@nestjs/common';
import type { ClientRenewal, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientScope } from '../../repositories/client.repository.interface';
import type {
  ClientRenewalRecord,
  ClientRenewalRepository,
  ClientRenewalTransactionClient,
  CreateClientRenewalData,
  ListClientRenewalsParams,
  ListClientRenewalsResult,
  SoftDeleteClientRenewalData,
  UpdateClientRenewalData,
} from './client-renewal.repository.interface';

@Injectable()
export class PrismaClientRenewalRepository implements ClientRenewalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord> {
    const db = tx ?? this.prisma;
    const renewal = await db.clientRenewal.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        amount: data.amount ?? null,
        currency: data.currency ?? null,
        renewalDate: data.renewalDate,
        reminderDate: data.reminderDate ?? null,
        autoNotify: data.autoNotify ?? true,
        status: data.status,
        reminderId: data.reminderId ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toClientRenewalRecord(renewal);
  }

  async update(
    scope: ClientScope,
    clientId: string,
    id: string,
    data: UpdateClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.clientRenewal.updateMany({
      where: activeWhere(scope, clientId, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, clientId, id, db);
  }

  async findById(
    scope: ClientScope,
    clientId: string,
    id: string,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord | null> {
    const db = tx ?? this.prisma;
    const renewal = await db.clientRenewal.findFirst({
      where: activeWhere(scope, clientId, id),
    });
    return renewal ? toClientRenewalRecord(renewal) : null;
  }

  async list(params: ListClientRenewalsParams): Promise<ListClientRenewalsResult> {
    const where: Prisma.ClientRenewalWhereInput = {
      tenantId: params.scope.tenantId,
      workspaceId: params.scope.workspaceId,
      clientId: params.clientId,
      deletedAt: null,
      ...(params.status !== undefined ? { status: params.status } : {}),
    };

    const skip = params.skip ?? 0;
    const take = params.take ?? 50;

    const [items, total] = await Promise.all([
      this.prisma.clientRenewal.findMany({
        where,
        orderBy: [{ renewalDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      this.prisma.clientRenewal.count({ where }),
    ]);

    return {
      items: items.map(toClientRenewalRecord),
      total,
    };
  }

  async softDelete(
    scope: ClientScope,
    clientId: string,
    id: string,
    data: SoftDeleteClientRenewalData,
    tx?: ClientRenewalTransactionClient,
  ): Promise<ClientRenewalRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.clientRenewal.updateMany({
      where: activeWhere(scope, clientId, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const renewal = await db.clientRenewal.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId,
      },
    });

    return renewal ? toClientRenewalRecord(renewal) : null;
  }
}

function activeWhere(scope: ClientScope, clientId: string, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    clientId,
    deletedAt: null,
  };
}

function toClientRenewalRecord(renewal: ClientRenewal): ClientRenewalRecord {
  return {
    id: renewal.id,
    tenantId: renewal.tenantId,
    workspaceId: renewal.workspaceId,
    clientId: renewal.clientId,
    type: renewal.type,
    title: renewal.title,
    description: renewal.description,
    amount: renewal.amount === null ? null : Number(renewal.amount),
    currency: renewal.currency,
    renewalDate: renewal.renewalDate,
    reminderDate: renewal.reminderDate,
    autoNotify: renewal.autoNotify,
    status: renewal.status,
    reminderId: renewal.reminderId,
    lastNotifiedAt: renewal.lastNotifiedAt,
    createdAt: renewal.createdAt,
    updatedAt: renewal.updatedAt,
    createdByUserId: renewal.createdByUserId,
    updatedByUserId: renewal.updatedByUserId,
    deletedAt: renewal.deletedAt,
    deletedByUserId: renewal.deletedByUserId,
  };
}
