import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { calculateQuotePricingSummary } from '../../../sales/pricing/pricing-engine';
import {
  INVOICE_REPOSITORY,
  type InvoiceRepository,
  type InvoiceScope,
} from '../../invoices/repositories/invoice.repository.interface';
import {
  INVOICE_LINE_ITEM_REPOSITORY,
  type InvoiceLineItemRepository,
} from '../../invoice-line-items/repositories/invoice-line-item.repository.interface';
import { PaymentDomainService } from '../domain/payment-domain.service';
import { PAYMENT_DOMAIN_ERROR_CODES, PaymentDomainError } from '../domain/payment-domain.errors';
import {
  PAYMENT_REPOSITORY,
  type CreatePaymentData,
  type PaymentRepository,
  type PaymentScope,
} from '../repositories/payment.repository.interface';
import type {
  CreatePaymentCommand,
  InvoicePaymentSummary,
  ListPaymentsQuery,
  ListPaymentsResult,
  PaymentApplicationContext,
  PaymentRecord,
} from './payment-application.types';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(INVOICE_LINE_ITEM_REPOSITORY)
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    private readonly paymentDomainService: PaymentDomainService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async listPayments(
    scope: PaymentScope,
    query: ListPaymentsQuery = {},
  ): Promise<ListPaymentsResult> {
    return this.paymentRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      invoiceId: query.invoiceId,
      status: query.status,
    });
  }

  async getPayment(scope: PaymentScope, paymentId: string): Promise<PaymentRecord> {
    const payment = await this.paymentRepository.findById(scope, paymentId);
    if (payment === null) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
        'Payment was not found.',
      );
    }

    return payment;
  }

  async getInvoicePaymentSummary(
    scope: PaymentScope,
    invoiceId: string,
  ): Promise<InvoicePaymentSummary> {
    const invoice = await this.requireInvoice(scope, invoiceId);
    const { grandTotal, amountPaid, outstandingAmount } = await this.computeBalances(
      scope,
      invoiceId,
    );

    return {
      invoiceId,
      currency: invoice.currency,
      grandTotal,
      amountPaid,
      outstandingAmount,
      invoiceStatus: invoice.status,
    };
  }

  async createPayment(
    scope: PaymentScope,
    command: CreatePaymentCommand,
    context: PaymentApplicationContext,
  ): Promise<PaymentRecord> {
    const invoice = await this.requireInvoice(scope, command.invoiceId);
    this.paymentDomainService.assertInvoicePayable(invoice.status, invoice.deletedAt);
    this.paymentDomainService.assertAmountValid(command.amount);

    const currency = (command.currency ?? invoice.currency).trim().toUpperCase();
    this.paymentDomainService.assertCurrencyMatch(currency, invoice.currency);

    const { outstandingAmount } = await this.computeBalances(scope, invoice.id);
    this.paymentDomainService.assertWithinOutstanding(command.amount, outstandingAmount);

    const now = new Date();
    const data: CreatePaymentData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      invoiceId: invoice.id,
      amount: command.amount,
      currency,
      status: 'COMPLETED',
      method: command.method,
      paidAt: command.paidAt,
      reference: this.paymentDomainService.normalizeOptionalText(command.reference),
      notes: this.paymentDomainService.normalizeOptionalText(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async () => {
      const payment = await this.paymentRepository.create(data);
      await this.syncInvoiceStatusAfterPaymentChange(scope, invoice.id, context);
      await this.activityService.createActivity(
        scope,
        {
          entityType: 'invoice',
          entityId: invoice.id,
          type: 'invoice.payment.recorded',
          title: `Payment of ${payment.amount.toFixed(2)} ${payment.currency} recorded`,
          metadata: {
            paymentId: payment.id,
            amount: payment.amount,
            method: payment.method,
          },
        },
        { actorUserId: context.actorUserId },
      );
      return payment;
    });
  }

  async voidPayment(
    scope: PaymentScope,
    paymentId: string,
    context: PaymentApplicationContext,
  ): Promise<PaymentRecord> {
    const existing = await this.paymentRepository.findById(scope, paymentId);
    if (existing === null) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
        'Payment was not found.',
      );
    }

    if (existing.deletedAt !== null || existing.status === 'VOIDED') {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_ALREADY_VOIDED,
        'Payment is already voided.',
      );
    }

    const now = new Date();

    return this.prisma.$transaction(async () => {
      const voided = await this.paymentRepository.softDelete(scope, paymentId, {
        status: 'VOIDED',
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (voided === null) {
        throw new PaymentDomainError(
          PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
          'Payment was not found.',
        );
      }

      await this.syncInvoiceStatusAfterPaymentChange(scope, existing.invoiceId, context);
      return voided;
    });
  }

  private async syncInvoiceStatusAfterPaymentChange(
    scope: PaymentScope,
    invoiceId: string,
    context: PaymentApplicationContext,
  ): Promise<void> {
    const invoice = await this.requireInvoice(scope, invoiceId);
    const { outstandingAmount } = await this.computeBalances(scope, invoiceId);
    const nextStatus = this.paymentDomainService.resolveInvoiceStatusAfterPayment({
      currentStatus: invoice.status,
      dueDate: invoice.dueDate,
      outstanding: outstandingAmount,
    });

    if (nextStatus === invoice.status) {
      return;
    }

    await this.invoiceRepository.update(scope, invoiceId, {
      status: nextStatus,
      updatedAt: new Date(),
      updatedByUserId: context.actorUserId,
    });
  }

  private async computeBalances(
    scope: PaymentScope,
    invoiceId: string,
  ): Promise<{ grandTotal: number; amountPaid: number; outstandingAmount: number }> {
    const [lineItems, amountPaid] = await Promise.all([
      this.invoiceLineItemRepository.listByInvoice({
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        invoiceId,
      }),
      this.paymentRepository.sumCompletedAmount(scope, invoiceId),
    ]);
    const summary = calculateQuotePricingSummary(
      lineItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      })),
    );
    const outstandingAmount = Math.max(
      0,
      Math.round((summary.grandTotal - amountPaid) * 100) / 100,
    );

    return {
      grandTotal: summary.grandTotal,
      amountPaid,
      outstandingAmount,
    };
  }

  private async requireInvoice(scope: InvoiceScope, invoiceId: string) {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId, {
      includeArchived: true,
    });

    if (invoice === null) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    return invoice;
  }
}
