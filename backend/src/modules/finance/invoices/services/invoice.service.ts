import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import type { ClientScope } from '../../../clients/repositories/client.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { calculateQuotePricingSummary, roundMoney } from '../../../sales/pricing/pricing-engine';
import {
  INVOICE_LINE_ITEM_REPOSITORY,
  type InvoiceLineItemRepository,
} from '../../invoice-line-items/repositories/invoice-line-item.repository.interface';
import { LedgerPostingService } from '../../ledger/services/ledger-posting.service';
import {
  PAYMENT_REPOSITORY,
  type PaymentRepository,
} from '../../payments/repositories/payment.repository.interface';
import { InvoiceDomainService } from '../domain/invoice-domain.service';
import { INVOICE_DOMAIN_ERROR_CODES, InvoiceDomainError } from '../domain/invoice-domain.errors';
import {
  INVOICE_REPOSITORY,
  type CreateInvoiceData,
  type InvoiceRepository,
  type InvoiceScope,
  type UpdateInvoiceData,
} from '../repositories/invoice.repository.interface';
import type {
  CreateInvoiceCommand,
  InvoiceApplicationContext,
  InvoiceRecord,
  ListInvoicesQuery,
  ListInvoicesResult,
  UpdateInvoiceCommand,
} from './invoice-application.types';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(INVOICE_LINE_ITEM_REPOSITORY)
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
    private readonly invoiceDomainService: InvoiceDomainService,
    private readonly activityService: ActivityService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly prisma: PrismaService,
  ) {}

  async createInvoice(
    scope: InvoiceScope,
    command: CreateInvoiceCommand,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const clientScope = toClientScope(scope);
    const invoiceNumber =
      command.invoiceNumber !== undefined && command.invoiceNumber.trim().length > 0
        ? this.invoiceDomainService.normalizeInvoiceNumber(command.invoiceNumber)
        : this.invoiceDomainService.generateInvoiceNumber();

    this.invoiceDomainService.validateCreate({
      invoiceNumber,
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      status: command.status,
    });

    await this.invoiceDomainService.validateClient(clientScope, command.clientId);
    await this.invoiceDomainService.validateProject(scope, command.projectId, command.clientId);

    if (command.quoteId !== undefined && command.quoteId !== null) {
      await this.invoiceDomainService.validateQuote(scope, command.quoteId, command.clientId);
    }

    await this.assertInvoiceNumberUnique(scope, invoiceNumber);

    const now = new Date();

    const data: CreateInvoiceData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      projectId: command.projectId,
      quoteId: command.quoteId ?? null,
      dealId: command.dealId ?? null,
      invoiceNumber,
      status: command.status ?? 'DRAFT',
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      currency: command.currency ?? 'USD',
      notes: this.invoiceDomainService.normalizeOptionalNotes(command.notes),
      terms: this.invoiceDomainService.normalizeOptionalTerms(command.terms),
      discountAmount: command.discountAmount ?? 0,
      taxAmount: 0,
      subtotal: 0,
      grandTotal: 0,
      balanceDue: 0,
      taxMode: command.taxMode ?? 'TAX_EXCLUSIVE',
      approvalStatus: command.approvalStatus ?? 'NOT_REQUIRED',
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const created = await this.invoiceRepository.create(data);
      await this.activityService.createActivity(
        scope,
        {
          entityType: 'invoice',
          entityId: created.id,
          type: 'invoice.created',
          title: 'Invoice created',
          description: `Invoice ${created.invoiceNumber} was created.`,
          metadata: {
            invoiceNumber: created.invoiceNumber,
            dealId: created.dealId,
            status: created.status,
          },
        },
        { actorUserId: context.actorUserId },
      );
      return created;
    });
  }

  async updateInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    command: UpdateInvoiceCommand,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const existing = await this.requireInvoice(scope, invoiceId, { includeArchived: true });
    const clientScope = toClientScope(scope);
    const nextClientId = command.clientId ?? existing.clientId;
    const nextProjectId = command.projectId ?? existing.projectId;
    const nextQuoteId = command.quoteId !== undefined ? command.quoteId : existing.quoteId;
    const nextInvoiceNumber =
      command.invoiceNumber !== undefined
        ? this.invoiceDomainService.normalizeInvoiceNumber(command.invoiceNumber)
        : undefined;

    this.invoiceDomainService.validateUpdate(existing, {
      invoiceNumber: nextInvoiceNumber,
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      status: command.status,
    });

    if (command.clientId !== undefined) {
      await this.invoiceDomainService.validateClient(clientScope, command.clientId);
    }

    if (command.projectId !== undefined || command.clientId !== undefined) {
      await this.invoiceDomainService.validateProject(scope, nextProjectId, nextClientId);
    }

    if (nextQuoteId !== null) {
      await this.invoiceDomainService.validateQuote(scope, nextQuoteId, nextClientId);
    }

    if (nextInvoiceNumber !== undefined && nextInvoiceNumber !== existing.invoiceNumber) {
      await this.assertInvoiceNumberUnique(scope, nextInvoiceNumber, invoiceId);
    }

    const now = new Date();
    const becomingSent = command.status === 'SENT' && existing.status !== 'SENT';

    const data: UpdateInvoiceData = {
      ...(command.clientId !== undefined ? { clientId: command.clientId } : {}),
      ...(command.projectId !== undefined ? { projectId: command.projectId } : {}),
      ...(command.quoteId !== undefined ? { quoteId: command.quoteId } : {}),
      ...(command.dealId !== undefined ? { dealId: command.dealId } : {}),
      ...(nextInvoiceNumber !== undefined ? { invoiceNumber: nextInvoiceNumber } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.issueDate !== undefined ? { issueDate: command.issueDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.currency !== undefined ? { currency: command.currency } : {}),
      ...(command.notes !== undefined
        ? { notes: this.invoiceDomainService.normalizeOptionalNotes(command.notes) }
        : {}),
      ...(command.terms !== undefined
        ? { terms: this.invoiceDomainService.normalizeOptionalTerms(command.terms) }
        : {}),
      ...(command.taxMode !== undefined ? { taxMode: command.taxMode } : {}),
      ...(command.discountAmount !== undefined ? { discountAmount: command.discountAmount } : {}),
      ...(command.approvalStatus !== undefined ? { approvalStatus: command.approvalStatus } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.invoiceRepository.update(scope, invoiceId, data);

      if (updated === null) {
        throw new InvoiceDomainError(
          INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
          'Invoice was not found.',
        );
      }

      if (becomingSent) {
        await this.activityService.createActivity(
          scope,
          {
            entityType: 'invoice',
            entityId: updated.id,
            type: 'invoice.sent',
            title: 'Invoice sent',
            description: `Invoice ${updated.invoiceNumber} was marked as sent.`,
            metadata: {
              invoiceNumber: updated.invoiceNumber,
              grandTotal: updated.grandTotal,
              balanceDue: updated.balanceDue,
            },
          },
          { actorUserId: context.actorUserId },
        );

        const amount = updated.grandTotal > 0 ? updated.grandTotal : updated.balanceDue;
        await this.ledgerPostingService.postInvoiceSent(
          scope,
          {
            entryDate: now,
            entityType: 'invoice',
            entityId: updated.id,
            clientId: updated.clientId,
            amount,
            description: `Invoice ${updated.invoiceNumber} sent`,
            referenceType: 'invoice',
            referenceId: updated.id,
          },
          { actorUserId: context.actorUserId },
        );
      }

      return updated;
    });
  }

  async markViewed(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const existing = await this.requireInvoice(scope, invoiceId);
    this.invoiceDomainService.assertCanMarkViewed(existing);

    const now = new Date();
    const data: UpdateInvoiceData = {
      viewedAt: now,
      ...(existing.status === 'SENT' ? { status: 'VIEWED' as const } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.invoiceRepository.update(scope, invoiceId, data);
      if (updated === null) {
        throw new InvoiceDomainError(
          INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
          'Invoice was not found.',
        );
      }
      return updated;
    });
  }

  async cancelInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const existing = await this.requireInvoice(scope, invoiceId);
    this.invoiceDomainService.assertCanCancel(existing);

    const now = new Date();

    return this.runInTransaction(async () => {
      const updated = await this.invoiceRepository.update(scope, invoiceId, {
        status: 'CANCELLED',
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (updated === null) {
        throw new InvoiceDomainError(
          INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
          'Invoice was not found.',
        );
      }

      await this.activityService.createActivity(
        scope,
        {
          entityType: 'invoice',
          entityId: updated.id,
          type: 'invoice.cancelled',
          title: 'Invoice cancelled',
          description: `Invoice ${updated.invoiceNumber} was cancelled.`,
          metadata: { invoiceNumber: updated.invoiceNumber },
        },
        { actorUserId: context.actorUserId },
      );

      return updated;
    });
  }

  async approveInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const existing = await this.requireInvoice(scope, invoiceId);
    this.invoiceDomainService.assertCanApprove(existing);

    const now = new Date();

    return this.runInTransaction(async () => {
      const updated = await this.invoiceRepository.update(scope, invoiceId, {
        approvalStatus: 'APPROVED',
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (updated === null) {
        throw new InvoiceDomainError(
          INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
          'Invoice was not found.',
        );
      }

      return updated;
    });
  }

  async recalculateInvoiceTotals(
    scope: InvoiceScope,
    invoiceId: string,
    context: InvoiceApplicationContext,
  ): Promise<InvoiceRecord> {
    const invoice = await this.requireInvoice(scope, invoiceId);
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

    const discountAmount = invoice.discountAmount;
    const subtotal = summary.subtotal;
    const taxAmount = summary.taxTotal;
    const grandTotal = roundMoney(Math.max(0, summary.grandTotal - discountAmount));
    const balanceDue = roundMoney(Math.max(0, grandTotal - amountPaid));

    const updated = await this.invoiceRepository.update(scope, invoiceId, {
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal,
      balanceDue,
      updatedAt: new Date(),
      updatedByUserId: context.actorUserId,
    });

    if (updated === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    return updated;
  }

  async getInvoice(scope: InvoiceScope, invoiceId: string): Promise<InvoiceRecord> {
    return this.requireInvoice(scope, invoiceId);
  }

  async listInvoices(
    scope: InvoiceScope,
    query: ListInvoicesQuery = {},
  ): Promise<ListInvoicesResult> {
    return this.invoiceRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
      clientId: query.clientId,
      projectId: query.projectId,
      quoteId: query.quoteId,
      includeArchived: query.includeArchived,
    });
  }

  private async assertInvoiceNumberUnique(
    scope: InvoiceScope,
    invoiceNumber: string,
    excludeInvoiceId?: string,
  ): Promise<void> {
    const existing = await this.invoiceRepository.findByInvoiceNumber(scope, invoiceNumber);

    if (existing !== null && existing.id !== excludeInvoiceId) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NUMBER_NOT_UNIQUE,
        'Invoice number is already in use.',
      );
    }
  }

  private async requireInvoice(
    scope: InvoiceScope,
    invoiceId: string,
    options?: { includeArchived?: boolean },
  ): Promise<InvoiceRecord> {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId, options);

    if (invoice === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    return invoice;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function toClientScope(scope: InvoiceScope): ClientScope {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
  };
}
