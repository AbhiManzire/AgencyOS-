import { Injectable } from '@nestjs/common';
import type { Client, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ArchiveClientData,
  ClientListSortField,
  ClientRecord,
  ClientRepository,
  ClientScope,
  ClientTransactionClient,
  CreateClientData,
  FindByIdOptions,
  ListClientsParams,
  ListClientsResult,
  RestoreClientData,
  UpdateClientData,
  WorkspaceOwnerOption,
} from './client.repository.interface';

@Injectable()
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateClientData, tx?: ClientTransactionClient): Promise<ClientRecord> {
    const db = tx ?? this.prisma;
    const client = await db.client.create({ data });
    return toClientRecord(client);
  }

  async update(
    scope: ClientScope,
    id: string,
    data: UpdateClientData,
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.client.updateMany({
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

    const client = await db.client.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return client ? toClientRecord(client) : null;
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

  async findByClientCode(scope: ClientScope, clientCode: string): Promise<ClientRecord | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        clientCode,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return client ? toClientRecord(client) : null;
  }

  async list(params: ListClientsParams): Promise<ListClientsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      status,
      includeArchived = false,
      archivedOnly = false,
      q,
      ownerUserId,
      tagId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();

    const where: Prisma.ClientWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(archivedOnly ? { deletedAt: { not: null } } : includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
      ...(tagId !== undefined
        ? {
            tags: {
              some: {
                tagId,
                tenantId: scope.tenantId,
              },
            },
          }
        : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { legalName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { clientCode: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip,
        take,
        orderBy,
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
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.client.updateMany({
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

    const client = await db.client.findFirst({
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
    tx?: ClientTransactionClient,
  ): Promise<ClientRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.client.updateMany({
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

    const client = await db.client.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return client ? toClientRecord(client) : null;
  }

  async listWorkspaceOwners(scope: ClientScope): Promise<readonly WorkspaceOwnerOption[]> {
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        user: {
          email: 'asc',
        },
      },
    });

    return employees.map((employee) => ({
      id: employee.user.id,
      displayName: resolveUserDisplayName(employee.user),
      email: employee.user.email,
    }));
  }

  async isWorkspaceMember(scope: ClientScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    return employee !== null;
  }

  async countActiveProjects(scope: ClientScope, clientId: string): Promise<number> {
    return this.prisma.project.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId,
        deletedAt: null,
        status: { in: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'INVOICE_READY'] },
      },
    });
  }

  async countOpenUnpaidInvoices(scope: ClientScope, clientId: string): Promise<number> {
    return this.prisma.invoice.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId,
        deletedAt: null,
        status: { in: ['DRAFT', 'SENT', 'OVERDUE'] },
      },
    });
  }
}

function buildOrderBy(
  sortBy: ClientListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.ClientOrderByWithRelationInput {
  switch (sortBy) {
    case 'displayName':
      return { displayName: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'email':
      return { email: sortOrder };
    case 'legalName':
      return { legalName: sortOrder };
    case 'createdAt':
    default:
      return { createdAt: sortOrder };
  }
}

function resolveUserDisplayName(user: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const fullName = [user.firstName, user.lastName]
    .filter((part): part is string => part !== null && part.trim().length > 0)
    .join(' ')
    .trim();

  return fullName.length > 0 ? fullName : user.email;
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
    clientCode: client.clientCode,
    industry: client.industry,
    website: client.website,
    phone: client.phone,
    email: client.email,
    gstin: client.gstin,
    pan: client.pan,
    currency: client.currency,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    stateRegion: client.stateRegion,
    postalCode: client.postalCode,
    countryCode: client.countryCode,
    shippingAddressLine1: client.shippingAddressLine1,
    shippingAddressLine2: client.shippingAddressLine2,
    shippingCity: client.shippingCity,
    shippingStateRegion: client.shippingStateRegion,
    shippingPostalCode: client.shippingPostalCode,
    shippingCountryCode: client.shippingCountryCode,
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
