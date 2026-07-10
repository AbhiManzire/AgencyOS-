import { Injectable } from '@nestjs/common';
import type { Payment, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreatePaymentData,
  ListPaymentsParams,
  ListPaymentsResult,
  PaymentRecord,
  PaymentRepository,
  PaymentScope,
} from './payment.repository.interface';

type PaymentWithInvoice = Payment & {
  invoice: { invoiceNumber: string; client: { displayName: string } };
};

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePaymentData): Promise<PaymentRecord> {
    const payment = await this.prisma.payment.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        currency: data.currency,
        status: data.status ?? 'COMPLETED',
        method: data.method,
        paidAt: data.paidAt,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: paymentInclude,
    });

    return toPaymentRecord(payment);
  }

  async findById(
    scope: PaymentScope,
    id: string,
    options?: { includeArchived?: boolean },
  ): Promise<PaymentRecord | null> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: paymentInclude,
    });

    return payment ? toPaymentRecord(payment) : null;
  }

  async list(params: ListPaymentsParams): Promise<ListPaymentsResult> {
    const { scope, skip = 0, take = 25, invoiceId, status, includeArchived = false } = params;

    const where: Prisma.PaymentWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(invoiceId !== undefined ? { invoiceId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { paidAt: 'desc' },
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      items: items.map(toPaymentRecord),
      total,
    };
  }

  async sumCompletedAmount(scope: PaymentScope, invoiceId: string): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        invoiceId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      _sum: { amount: true },
    });

    return result._sum.amount?.toNumber() ?? 0;
  }

  async softDelete(
    scope: PaymentScope,
    id: string,
    data: {
      deletedAt: Date;
      deletedByUserId: string | null;
      updatedAt: Date;
      updatedByUserId: string | null;
      status: 'VOIDED';
    },
  ): Promise<PaymentRecord | null> {
    const result = await this.prisma.payment.updateMany({
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

    return this.findById(scope, id, { includeArchived: true });
  }
}

const paymentInclude = {
  invoice: {
    select: {
      invoiceNumber: true,
      client: { select: { displayName: true } },
    },
  },
} as const;

function toPaymentRecord(payment: PaymentWithInvoice): PaymentRecord {
  return {
    id: payment.id,
    tenantId: payment.tenantId,
    workspaceId: payment.workspaceId,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice.invoiceNumber,
    clientName: payment.invoice.client.displayName,
    amount: payment.amount.toNumber(),
    currency: payment.currency,
    status: payment.status,
    method: payment.method,
    paidAt: payment.paidAt,
    reference: payment.reference,
    notes: payment.notes,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
    createdByUserId: payment.createdByUserId,
    updatedByUserId: payment.updatedByUserId,
    deletedAt: payment.deletedAt,
    deletedByUserId: payment.deletedByUserId,
  };
}
