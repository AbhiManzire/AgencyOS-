import { Injectable } from '@nestjs/common';
import { Prisma, type PurchaseBill } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchivePurchaseBillData,
  CreatePurchaseBillData,
  FindPurchaseBillByIdOptions,
  ListPurchaseBillsParams,
  ListPurchaseBillsResult,
  PurchaseBillListSortField,
  PurchaseBillRecord,
  PurchaseBillRepository,
  PurchaseBillScope,
  PurchaseBillTransactionClient,
  UpdatePurchaseBillData,
} from './purchase-bill.repository.interface';

@Injectable()
export class PrismaPurchaseBillRepository implements PurchaseBillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord> {
    const db = tx ?? this.prisma;
    const bill = await db.purchaseBill.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        vendorId: data.vendorId,
        billNumber: data.billNumber,
        status: data.status ?? 'DRAFT',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        currency: data.currency,
        notes: data.notes ?? null,
        subtotal: new Prisma.Decimal(data.subtotal ?? 0),
        taxAmount: new Prisma.Decimal(data.taxAmount ?? 0),
        grandTotal: new Prisma.Decimal(data.grandTotal ?? 0),
        balanceDue: new Prisma.Decimal(data.balanceDue ?? 0),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toRecord(bill);
  }

  async update(
    scope: PurchaseBillScope,
    id: string,
    data: UpdatePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord | null> {
    const db = tx ?? this.prisma;
    const { subtotal, taxAmount, grandTotal, balanceDue, ...rest } = data;
    const result = await db.purchaseBill.updateMany({
      where: activeWhere(scope, id),
      data: {
        ...rest,
        ...(subtotal !== undefined ? { subtotal: new Prisma.Decimal(subtotal) } : {}),
        ...(taxAmount !== undefined ? { taxAmount: new Prisma.Decimal(taxAmount) } : {}),
        ...(grandTotal !== undefined ? { grandTotal: new Prisma.Decimal(grandTotal) } : {}),
        ...(balanceDue !== undefined ? { balanceDue: new Prisma.Decimal(balanceDue) } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async archive(
    scope: PurchaseBillScope,
    id: string,
    data: ArchivePurchaseBillData,
    tx?: PurchaseBillTransactionClient,
  ): Promise<PurchaseBillRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.purchaseBill.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async findById(
    scope: PurchaseBillScope,
    id: string,
    options?: FindPurchaseBillByIdOptions,
  ): Promise<PurchaseBillRecord | null> {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });
    return bill ? toRecord(bill) : null;
  }

  async list(params: ListPurchaseBillsParams): Promise<ListPurchaseBillsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      q,
      vendorId,
      status,
      includeArchived = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();
    const where: Prisma.PurchaseBillWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(vendorId !== undefined ? { vendorId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { billNumber: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseBill.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sortBy, sortOrder),
      }),
      this.prisma.purchaseBill.count({ where }),
    ]);

    return { items: items.map(toRecord), total };
  }

  private async findByIdWithClient(
    db: PurchaseBillTransactionClient | PrismaService,
    scope: PurchaseBillScope,
    id: string,
  ): Promise<PurchaseBillRecord | null> {
    const bill = await db.purchaseBill.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return bill ? toRecord(bill) : null;
  }
}

function activeWhere(scope: PurchaseBillScope, id: string) {
  return { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId, deletedAt: null };
}

function buildOrderBy(
  sortBy: PurchaseBillListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.PurchaseBillOrderByWithRelationInput {
  switch (sortBy) {
    case 'billNumber':
      return { billNumber: sortOrder };
    case 'issueDate':
      return { issueDate: sortOrder };
    case 'dueDate':
      return { dueDate: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
    default:
      return { updatedAt: sortOrder };
  }
}

function toRecord(bill: PurchaseBill): PurchaseBillRecord {
  return {
    id: bill.id,
    tenantId: bill.tenantId,
    workspaceId: bill.workspaceId,
    vendorId: bill.vendorId,
    billNumber: bill.billNumber,
    status: bill.status,
    issueDate: bill.issueDate,
    dueDate: bill.dueDate,
    currency: bill.currency,
    notes: bill.notes,
    subtotal: Number(bill.subtotal),
    taxAmount: Number(bill.taxAmount),
    grandTotal: Number(bill.grandTotal),
    balanceDue: Number(bill.balanceDue),
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    createdByUserId: bill.createdByUserId,
    updatedByUserId: bill.updatedByUserId,
    deletedAt: bill.deletedAt,
    deletedByUserId: bill.deletedByUserId,
  };
}
