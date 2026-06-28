import { Injectable } from '@nestjs/common';
import type { Client } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ArchiveClientData,
  ClientRecord,
  ClientRepository,
  ClientScope,
  CreateClientData,
  FindByIdOptions,
  ListClientsParams,
  ListClientsResult,
  RestoreClientData,
  UpdateClientData,
} from './client.repository.interface';

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData): Promise<ClientRecord> {
    const client = await this.prisma.client.create({ data });
    return toClientRecord(client);
  }

  async update(
    scope: ClientScope,
    id: string,
    data: UpdateClientData,
  ): Promise<ClientRecord | null> {
    const result = await this.prisma.client.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: ClientScope,
    id: string,
    options?: FindByIdOptions,
  ): Promise<ClientRecord | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });

    return client ? toClientRecord(client) : null;
  }

  async findBySlug(scope: ClientScope, slug: string): Promise<ClientRecord | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        slug,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return client ? toClientRecord(client) : null;
  }

  async list(params: ListClientsParams): Promise<ListClientsResult> {
    const { scope, skip = 0, take = 25, status, includeArchived = false } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items: items.map(toClientRecord),
      total,
    };
  }

  async archive(
    scope: ClientScope,
    id: string,
    data: ArchiveClientData,
  ): Promise<ClientRecord | null> {
    const result = await this.prisma.client.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        status: data.status,
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return client ? toClientRecord(client) : null;
  }

  async restore(
    scope: ClientScope,
    id: string,
    data: RestoreClientData,
  ): Promise<ClientRecord | null> {
    const result = await this.prisma.client.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: { not: null },
      },
      data: {
        status: data.status,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id, { includeArchived: true });
  }
}

function toClientRecord(client: Client): ClientRecord {
  return {
    id: client.id,
    tenantId: client.tenantId,
    workspaceId: client.workspaceId,
    displayName: client.displayName,
    slug: client.slug,
    status: client.status,
    legalName: client.legalName,
    industry: client.industry,
    website: client.website,
    phone: client.phone,
    email: client.email,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    stateRegion: client.stateRegion,
    postalCode: client.postalCode,
    countryCode: client.countryCode,
    ownerUserId: client.ownerUserId,
    source: client.source,
    externalReferenceId: client.externalReferenceId,
    becameClientAt: client.becameClientAt,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    createdByUserId: client.createdByUserId,
    updatedByUserId: client.updatedByUserId,
    deletedAt: client.deletedAt,
    deletedByUserId: client.deletedByUserId,
  };
}
