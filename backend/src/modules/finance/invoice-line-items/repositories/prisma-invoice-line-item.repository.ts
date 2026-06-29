import { Injectable } from '@nestjs/common';
import { Prisma, type InvoiceLineItem } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateInvoiceLineItemData,
  InvoiceLineItemInvoiceScope,
  InvoiceLineItemRecord,
  InvoiceLineItemRepository,
  InvoiceLineItemScope,
  SoftDeleteInvoiceLineItemData,
  UpdateInvoiceLineItemData,
} from './invoice-line-item.repository.interface';

@Injectable()
export class PrismaInvoiceLineItemRepository implements InvoiceLineItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateInvoiceLineItemData): Promise<InvoiceLineItemRecord> {
    const lineItem = await this.prisma.invoiceLineItem.create({
      data: {
        ...data,
        quantity: new Prisma.Decimal(data.quantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        discount: new Prisma.Decimal(data.discount ?? 0),
        tax: new Prisma.Decimal(data.tax ?? 0),
        total: new Prisma.Decimal(data.total),
      },
    });

    return toInvoiceLineItemRecord(lineItem);
  }

  async update(
    scope: InvoiceLineItemScope,
    id: string,
    data: UpdateInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord | null> {
    const { quantity, unitPrice, discount, tax, total, ...rest } = data;

    const result = await this.prisma.invoiceLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data: {
        ...rest,
        ...(quantity !== undefined ? { quantity: new Prisma.Decimal(quantity) } : {}),
        ...(unitPrice !== undefined ? { unitPrice: new Prisma.Decimal(unitPrice) } : {}),
        ...(discount !== undefined ? { discount: new Prisma.Decimal(discount) } : {}),
        ...(tax !== undefined ? { tax: new Prisma.Decimal(tax) } : {}),
        ...(total !== undefined ? { total: new Prisma.Decimal(total) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: InvoiceLineItemScope,
    id: string,
    data: SoftDeleteInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord | null> {
    const result = await this.prisma.invoiceLineItem.updateMany({
      where: activeLineItemWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const lineItem = await this.prisma.invoiceLineItem.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });

    return lineItem ? toInvoiceLineItemRecord(lineItem) : null;
  }

  async findById(scope: InvoiceLineItemScope, id: string): Promise<InvoiceLineItemRecord | null> {
    const lineItem = await this.prisma.invoiceLineItem.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });

    return lineItem ? toInvoiceLineItemRecord(lineItem) : null;
  }

  async listByInvoice(
    scope: InvoiceLineItemInvoiceScope,
  ): Promise<readonly InvoiceLineItemRecord[]> {
    const lineItems = await this.prisma.invoiceLineItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        invoiceId: scope.invoiceId,
        deletedAt: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return lineItems.map(toInvoiceLineItemRecord);
  }

  async getMaxSortOrder(scope: InvoiceLineItemInvoiceScope): Promise<number> {
    const result = await this.prisma.invoiceLineItem.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        invoiceId: scope.invoiceId,
        deletedAt: null,
      },
      _max: { sortOrder: true },
    });

    return result._max.sortOrder ?? -1;
  }
}

function activeLineItemWhere(scope: InvoiceLineItemScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toInvoiceLineItemRecord(lineItem: InvoiceLineItem): InvoiceLineItemRecord {
  return {
    id: lineItem.id,
    tenantId: lineItem.tenantId,
    workspaceId: lineItem.workspaceId,
    invoiceId: lineItem.invoiceId,
    name: lineItem.name,
    description: lineItem.description,
    quantity: lineItem.quantity.toNumber(),
    unit: lineItem.unit,
    unitPrice: lineItem.unitPrice.toNumber(),
    discount: lineItem.discount.toNumber(),
    tax: lineItem.tax.toNumber(),
    total: lineItem.total.toNumber(),
    sortOrder: lineItem.sortOrder,
    createdAt: lineItem.createdAt,
    updatedAt: lineItem.updatedAt,
    createdByUserId: lineItem.createdByUserId,
    updatedByUserId: lineItem.updatedByUserId,
    deletedAt: lineItem.deletedAt,
    deletedByUserId: lineItem.deletedByUserId,
  };
}
