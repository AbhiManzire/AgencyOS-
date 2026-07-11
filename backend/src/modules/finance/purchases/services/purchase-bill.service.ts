import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LedgerPostingService } from '../../ledger/services/ledger-posting.service';
import { PurchaseBillDomainService } from '../domain/purchase-bill-domain.service';
import {
  PURCHASE_BILL_DOMAIN_ERROR_CODES,
  PurchaseBillDomainError,
} from '../domain/purchase-bill-domain.errors';
import {
  PURCHASE_BILL_REPOSITORY,
  type CreatePurchaseBillData,
  type PurchaseBillRepository,
  type PurchaseBillTransactionClient,
  type UpdatePurchaseBillData,
} from '../repositories/purchase-bill.repository.interface';
import {
  PURCHASE_BILL_LINE_ITEM_REPOSITORY,
  type CreatePurchaseBillLineItemData,
  type PurchaseBillLineItemRepository,
  type UpdatePurchaseBillLineItemData,
} from '../repositories/purchase-bill-line-item.repository.interface';
import {
  PURCHASE_PAYMENT_REPOSITORY,
  type CreatePurchasePaymentData,
  type PurchasePaymentRepository,
} from '../repositories/purchase-payment.repository.interface';
import type {
  CreatePurchaseBillCommand,
  CreatePurchaseBillLineItemCommand,
  CreatePurchasePaymentCommand,
  ListPurchaseBillsQuery,
  ListPurchaseBillsResult,
  PurchaseApplicationContext,
  PurchaseBillLineItemRecord,
  PurchaseBillRecord,
  PurchaseBillScope,
  PurchasePaymentRecord,
  UpdatePurchaseBillCommand,
  UpdatePurchaseBillLineItemCommand,
} from './purchase-application.types';

@Injectable()
export class PurchaseBillService {
  constructor(
    @Inject(PURCHASE_BILL_REPOSITORY)
    private readonly billRepository: PurchaseBillRepository,
    @Inject(PURCHASE_BILL_LINE_ITEM_REPOSITORY)
    private readonly lineItemRepository: PurchaseBillLineItemRepository,
    @Inject(PURCHASE_PAYMENT_REPOSITORY)
    private readonly paymentRepository: PurchasePaymentRepository,
    private readonly domainService: PurchaseBillDomainService,
    private readonly activityService: ActivityService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly prisma: PrismaService,
  ) {}

  async createBill(
    scope: PurchaseBillScope,
    command: CreatePurchaseBillCommand,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillRecord> {
    this.domainService.validateCreate({
      vendorId: command.vendorId,
      billNumber: command.billNumber,
      status: command.status,
      currency: command.currency,
      issueDate: command.issueDate,
      dueDate: command.dueDate,
    });

    const now = new Date();
    const data: CreatePurchaseBillData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      vendorId: command.vendorId,
      billNumber: this.domainService.normalizeRequiredString(command.billNumber),
      status: command.status ?? 'DRAFT',
      issueDate: command.issueDate,
      dueDate: command.dueDate,
      currency: this.domainService.normalizeCurrency(command.currency),
      notes: this.domainService.normalizeOptionalString(command.notes),
      subtotal: 0,
      taxAmount: 0,
      grandTotal: 0,
      balanceDue: 0,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => this.billRepository.create(data, tx));
  }

  async updateBill(
    scope: PurchaseBillScope,
    billId: string,
    command: UpdatePurchaseBillCommand,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillRecord> {
    const existing = await this.requireBill(scope, billId);
    this.domainService.validateUpdate(existing, command);
    const now = new Date();
    const data: UpdatePurchaseBillData = {
      ...(command.vendorId !== undefined ? { vendorId: command.vendorId } : {}),
      ...(command.billNumber !== undefined
        ? { billNumber: this.domainService.normalizeRequiredString(command.billNumber) }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.issueDate !== undefined ? { issueDate: command.issueDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.currency !== undefined
        ? { currency: this.domainService.normalizeCurrency(command.currency) }
        : {}),
      ...(command.notes !== undefined
        ? { notes: this.domainService.normalizeOptionalString(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.billRepository.update(scope, billId, data, tx);
      if (updated === null) {
        throw new PurchaseBillDomainError(
          PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_NOT_FOUND,
          'Purchase bill was not found.',
        );
      }
      return updated;
    });
  }

  async archiveBill(
    scope: PurchaseBillScope,
    billId: string,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillRecord> {
    const existing = await this.requireBill(scope, billId);
    this.domainService.validateArchive(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.billRepository.archive(
        scope,
        billId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (archived === null) {
        throw new PurchaseBillDomainError(
          PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_NOT_FOUND,
          'Purchase bill was not found.',
        );
      }
      return archived;
    });
  }

  async getBill(scope: PurchaseBillScope, billId: string): Promise<PurchaseBillRecord> {
    const bill = await this.requireBill(scope, billId);
    this.domainService.ensureWorkspaceOwnership(scope, bill);
    return bill;
  }

  async listBills(
    scope: PurchaseBillScope,
    query: ListPurchaseBillsQuery = {},
  ): Promise<ListPurchaseBillsResult> {
    return this.billRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      q: query.q,
      vendorId: query.vendorId,
      status: query.status,
      includeArchived: query.includeArchived,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async listLineItems(
    scope: PurchaseBillScope,
    billId: string,
  ): Promise<readonly PurchaseBillLineItemRecord[]> {
    await this.requireBill(scope, billId);
    return this.lineItemRepository.listByBill(scope, billId);
  }

  async createLineItem(
    scope: PurchaseBillScope,
    billId: string,
    command: CreatePurchaseBillLineItemCommand,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillLineItemRecord> {
    await this.requireBill(scope, billId);
    this.domainService.validateLineItem(command);
    const now = new Date();
    const total = this.domainService.computeLineTotal(
      command.quantity,
      command.unitPrice,
      command.discount ?? 0,
      command.tax ?? 0,
    );

    const data: CreatePurchaseBillLineItemData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      purchaseBillId: billId,
      name: this.domainService.normalizeRequiredString(command.name),
      description: this.domainService.normalizeOptionalString(command.description),
      quantity: command.quantity,
      unit: this.domainService.normalizeOptionalString(command.unit),
      unitPrice: command.unitPrice,
      discount: command.discount ?? 0,
      tax: command.tax ?? 0,
      total,
      sortOrder: command.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const created = await this.lineItemRepository.create(data, tx);
      await this.recalcBillTotals(scope, billId, context, tx);
      return created;
    });
  }

  async updateLineItem(
    scope: PurchaseBillScope,
    lineItemId: string,
    command: UpdatePurchaseBillLineItemCommand,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillLineItemRecord> {
    const existing = await this.lineItemRepository.findById(scope, lineItemId);
    if (existing === null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
        'Line item was not found.',
      );
    }
    await this.requireBill(scope, existing.purchaseBillId);

    const quantity = command.quantity ?? existing.quantity;
    const unitPrice = command.unitPrice ?? existing.unitPrice;
    const discount = command.discount ?? existing.discount;
    const tax = command.tax ?? existing.tax;
    if (
      command.name !== undefined ||
      command.quantity !== undefined ||
      command.unitPrice !== undefined
    ) {
      this.domainService.validateLineItem({
        name: command.name ?? existing.name,
        quantity,
        unitPrice,
        discount,
        tax,
      });
    }

    const now = new Date();
    const data: UpdatePurchaseBillLineItemData = {
      ...(command.name !== undefined
        ? { name: this.domainService.normalizeRequiredString(command.name) }
        : {}),
      ...(command.description !== undefined
        ? { description: this.domainService.normalizeOptionalString(command.description) }
        : {}),
      ...(command.quantity !== undefined ? { quantity: command.quantity } : {}),
      ...(command.unit !== undefined
        ? { unit: this.domainService.normalizeOptionalString(command.unit) }
        : {}),
      ...(command.unitPrice !== undefined ? { unitPrice: command.unitPrice } : {}),
      ...(command.discount !== undefined ? { discount: command.discount } : {}),
      ...(command.tax !== undefined ? { tax: command.tax } : {}),
      ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
      total: this.domainService.computeLineTotal(quantity, unitPrice, discount, tax),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.lineItemRepository.update(scope, lineItemId, data, tx);
      if (updated === null) {
        throw new PurchaseBillDomainError(
          PURCHASE_BILL_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }
      await this.recalcBillTotals(scope, existing.purchaseBillId, context, tx);
      return updated;
    });
  }

  async deleteLineItem(
    scope: PurchaseBillScope,
    lineItemId: string,
    context: PurchaseApplicationContext,
  ): Promise<PurchaseBillLineItemRecord> {
    const existing = await this.lineItemRepository.findById(scope, lineItemId);
    if (existing === null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
        'Line item was not found.',
      );
    }
    await this.requireBill(scope, existing.purchaseBillId);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const deleted = await this.lineItemRepository.softDelete(
        scope,
        lineItemId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (deleted === null) {
        throw new PurchaseBillDomainError(
          PURCHASE_BILL_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }
      await this.recalcBillTotals(scope, existing.purchaseBillId, context, tx);
      return deleted;
    });
  }

  async createPayment(
    scope: PurchaseBillScope,
    billId: string,
    command: CreatePurchasePaymentCommand,
    context: PurchaseApplicationContext,
  ): Promise<PurchasePaymentRecord> {
    const bill = await this.requireBill(scope, billId);
    const amountPaid = await this.paymentRepository.sumCompletedAmount(scope, billId);
    const outstanding = Math.max(0, bill.grandTotal - amountPaid);
    this.domainService.validatePayment(bill, command.amount, outstanding);

    const now = new Date();
    const data: CreatePurchasePaymentData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      purchaseBillId: billId,
      amount: command.amount,
      currency: this.domainService.normalizeCurrency(command.currency ?? bill.currency),
      method: command.method,
      paidAt: command.paidAt,
      reference: this.domainService.normalizeOptionalString(command.reference),
      notes: this.domainService.normalizeOptionalString(command.notes),
      approvalStatus: command.approvalStatus ?? 'NOT_REQUIRED',
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const payment = await this.paymentRepository.create(data, tx);
      const newPaid = amountPaid + payment.amount;
      const status = this.domainService.resolveStatusAfterPayment(bill.grandTotal, newPaid);
      const balanceDue = Math.max(0, bill.grandTotal - newPaid);

      await this.billRepository.update(
        scope,
        billId,
        {
          status,
          balanceDue,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (status === 'PAID') {
        await this.activityService.createActivity(
          scope,
          {
            entityType: 'purchase_bill',
            entityId: billId,
            type: 'bill.paid',
            title: 'Bill Paid',
            description: 'Purchase bill was fully paid.',
            metadata: { paymentId: payment.id, amount: payment.amount },
          },
          { actorUserId: context.actorUserId },
        );
      }

      await this.ledgerPostingService.postBillPaid(
        scope,
        {
          entryDate: payment.paidAt,
          entityType: 'purchase_payment',
          entityId: payment.id,
          vendorId: bill.vendorId,
          amount: payment.amount,
          description: `Payment for bill ${bill.billNumber}`,
          referenceType: 'purchase_bill',
          referenceId: billId,
        },
        { actorUserId: context.actorUserId },
      );

      return payment;
    });
  }

  async voidPayment(
    scope: PurchaseBillScope,
    paymentId: string,
    context: PurchaseApplicationContext,
  ): Promise<PurchasePaymentRecord> {
    const payment = await this.paymentRepository.findById(scope, paymentId);
    if (payment === null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
        'Purchase payment was not found.',
      );
    }
    if (payment.status === 'VOIDED' || payment.deletedAt !== null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.PAYMENT_ALREADY_VOIDED,
        'Purchase payment is already voided.',
      );
    }

    const now = new Date();
    return this.runInTransaction(async (tx) => {
      const voided = await this.paymentRepository.void(
        scope,
        paymentId,
        {
          status: 'VOIDED',
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (voided === null) {
        throw new PurchaseBillDomainError(
          PURCHASE_BILL_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
          'Purchase payment was not found.',
        );
      }

      const bill = await this.requireBill(scope, payment.purchaseBillId);
      const amountPaid = await this.paymentRepository.sumCompletedAmount(
        scope,
        payment.purchaseBillId,
        tx,
      );
      const status = this.domainService.resolveStatusAfterPayment(bill.grandTotal, amountPaid);
      await this.billRepository.update(
        scope,
        payment.purchaseBillId,
        {
          status,
          balanceDue: Math.max(0, bill.grandTotal - amountPaid),
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      return voided;
    });
  }

  async listPayments(
    scope: PurchaseBillScope,
    billId: string,
  ): Promise<readonly PurchasePaymentRecord[]> {
    await this.requireBill(scope, billId);
    const result = await this.paymentRepository.list({
      scope,
      purchaseBillId: billId,
      take: 100,
    });
    return result.items;
  }

  async getPayment(scope: PurchaseBillScope, paymentId: string): Promise<PurchasePaymentRecord> {
    const payment = await this.paymentRepository.findById(scope, paymentId);
    if (payment === null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.PAYMENT_NOT_FOUND,
        'Purchase payment was not found.',
      );
    }
    return payment;
  }

  private async recalcBillTotals(
    scope: PurchaseBillScope,
    billId: string,
    context: PurchaseApplicationContext,
    tx: PurchaseBillTransactionClient,
  ): Promise<void> {
    const items = await this.lineItemRepository.listByBill(scope, billId);
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
      0,
    );
    const taxAmount = items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;
    const amountPaid = await this.paymentRepository.sumCompletedAmount(scope, billId, tx);
    const balanceDue = Math.max(0, grandTotal - amountPaid);

    await this.billRepository.update(
      scope,
      billId,
      {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        grandTotal,
        balanceDue,
        updatedAt: new Date(),
        updatedByUserId: context.actorUserId,
      },
      tx,
    );
  }

  private async runInTransaction<T>(
    work: (tx: PurchaseBillTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async requireBill(scope: PurchaseBillScope, billId: string): Promise<PurchaseBillRecord> {
    const bill = await this.billRepository.findById(scope, billId);
    if (bill === null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_NOT_FOUND,
        'Purchase bill was not found.',
      );
    }
    return bill;
  }
}
