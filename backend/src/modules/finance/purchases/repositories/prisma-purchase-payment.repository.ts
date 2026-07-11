import { Injectable } from '@nestjs/common';
import { Prisma, type PurchasePayment } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreatePurchasePaymentData,
  ListPurchasePaymentsParams,
  ListPurchasePaymentsResult,
  PurchasePaymentRecord,
  PurchasePaymentRepository,
  PurchasePaymentScope,
  PurchasePaymentTransactionClient,
  VoidPurchasePaymentData,
} from './purchase-payment.repository.interface';

@Injectable()
export class PrismaPurchasePaymentRepository implements PurchasePaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePurchasePaymentData,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<PurchasePaymentRecord> {
    const db = tx ?? this.prisma;
    const payment = await db.purchasePayment.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        purchaseBillId: data.purchaseBillId,
        amount: new Prisma.Decimal(data.amount),
        currency: data.currency,
        status: data.status ?? 'COMPLETED',
        method: data.method,
        paidAt: data.paidAt,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        approvalStatus: data.approvalStatus ?? 'NOT_REQUIRED',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toRecord(payment);
  }

  async void(
    scope: PurchasePaymentScope,
    id: string,
    data: VoidPurchasePaymentData,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<PurchasePaymentRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.purchasePayment.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        status: 'COMPLETED',
      },
      data: {
        status: data.status,
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) return null;
    const payment = await db.purchasePayment.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return payment ? toRecord(payment) : null;
  }

  async findById(
    scope: PurchasePaymentScope,
    id: string,
    options?: { includeArchived?: boolean },
  ): Promise<PurchasePaymentRecord | null> {
    const payment = await this.prisma.purchasePayment.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });
    return payment ? toRecord(payment) : null;
  }

  async list(params: ListPurchasePaymentsParams): Promise<ListPurchasePaymentsResult> {
    const { scope, skip = 0, take = 25, purchaseBillId, status, includeArchived = false } = params;

    const where: Prisma.PurchasePaymentWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(purchaseBillId !== undefined ? { purchaseBillId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchasePayment.findMany({
        where,
        skip,
        take,
        orderBy: { paidAt: 'desc' },
      }),
      this.prisma.purchasePayment.count({ where }),
    ]);

    return { items: items.map(toRecord), total };
  }

  async sumCompletedAmount(
    scope: PurchasePaymentScope,
    purchaseBillId: string,
    tx?: PurchasePaymentTransactionClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const result = await db.purchasePayment.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        purchaseBillId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      _sum: { amount: true },
    });
    return result._sum.amount === null ? 0 : Number(result._sum.amount);
  }
}

function toRecord(payment: PurchasePayment): PurchasePaymentRecord {
  return {
    id: payment.id,
    tenantId: payment.tenantId,
    workspaceId: payment.workspaceId,
    purchaseBillId: payment.purchaseBillId,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    paidAt: payment.paidAt,
    reference: payment.reference,
    notes: payment.notes,
    approvalStatus: payment.approvalStatus,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    createdByUserId: payment.createdByUserId,
    updatedByUserId: payment.updatedByUserId,
    deletedAt: payment.deletedAt,
    deletedByUserId: payment.deletedByUserId,
  };
}
