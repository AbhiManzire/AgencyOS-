import { Injectable } from '@nestjs/common';
import { Prisma, type Vendor } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveVendorData,
  CreateVendorData,
  FindVendorByIdOptions,
  ListVendorsParams,
  ListVendorsResult,
  RestoreVendorData,
  UpdateVendorData,
  VendorListSortField,
  VendorRecord,
  VendorRepository,
  VendorScope,
  VendorTransactionClient,
} from './vendor.repository.interface';

@Injectable()
export class PrismaVendorRepository implements VendorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVendorData, tx?: VendorTransactionClient): Promise<VendorRecord> {
    const db = tx ?? this.prisma;
    const vendor = await db.vendor.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        code: data.code ?? null,
        gstin: data.gstin ?? null,
        pan: data.pan ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        contactPerson: data.contactPerson ?? null,
        paymentTermsDays: data.paymentTermsDays ?? null,
        currency: data.currency,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toVendorRecord(vendor);
  }

  async update(
    scope: VendorScope,
    id: string,
    data: UpdateVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.vendor.updateMany({
      where: activeWhere(scope, id),
      data,
    });
    if (result.count === 0) {
      return null;
    }
    return this.findByIdWithClient(db, scope, id);
  }

  async archive(
    scope: VendorScope,
    id: string,
    data: ArchiveVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.vendor.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findByIdWithClient(db, scope, id);
  }

  async restore(
    scope: VendorScope,
    id: string,
    data: RestoreVendorData,
    tx?: VendorTransactionClient,
  ): Promise<VendorRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.vendor.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findByIdWithClient(db, scope, id);
  }

  async findById(
    scope: VendorScope,
    id: string,
    options?: FindVendorByIdOptions,
  ): Promise<VendorRecord | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });
    return vendor ? toVendorRecord(vendor) : null;
  }

  async list(params: ListVendorsParams): Promise<ListVendorsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      q,
      includeArchived = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();
    const where: Prisma.VendorWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(search && search.length > 0
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sortBy, sortOrder),
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { items: items.map(toVendorRecord), total };
  }

  private async findByIdWithClient(
    db: VendorTransactionClient | PrismaService,
    scope: VendorScope,
    id: string,
  ): Promise<VendorRecord | null> {
    const vendor = await db.vendor.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return vendor ? toVendorRecord(vendor) : null;
  }
}

function activeWhere(scope: VendorScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function buildOrderBy(
  sortBy: VendorListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.VendorOrderByWithRelationInput {
  switch (sortBy) {
    case 'name':
      return { name: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
    default:
      return { updatedAt: sortOrder };
  }
}

function toVendorRecord(vendor: Vendor): VendorRecord {
  return {
    id: vendor.id,
    tenantId: vendor.tenantId,
    workspaceId: vendor.workspaceId,
    name: vendor.name,
    code: vendor.code,
    gstin: vendor.gstin,
    pan: vendor.pan,
    email: vendor.email,
    phone: vendor.phone,
    contactPerson: vendor.contactPerson,
    paymentTermsDays: vendor.paymentTermsDays,
    currency: vendor.currency,
    notes: vendor.notes,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
    createdByUserId: vendor.createdByUserId,
    updatedByUserId: vendor.updatedByUserId,
    deletedAt: vendor.deletedAt,
    deletedByUserId: vendor.deletedByUserId,
  };
}
