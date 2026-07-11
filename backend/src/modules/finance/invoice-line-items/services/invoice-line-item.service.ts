import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { calculateLineItemTotal } from '../../../sales/pricing/pricing-engine';
import {
  INVOICE_DOMAIN_ERROR_CODES,
  InvoiceDomainError,
} from '../../invoices/domain/invoice-domain.errors';
import {
  INVOICE_REPOSITORY,
  type InvoiceRepository,
  type InvoiceScope,
} from '../../invoices/repositories/invoice.repository.interface';
import { InvoiceService } from '../../invoices/services/invoice.service';
import { InvoiceLineItemDomainService } from '../domain/invoice-line-item-domain.service';
import {
  INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES,
  InvoiceLineItemDomainError,
} from '../domain/invoice-line-item-domain.errors';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  INVOICE_LINE_ITEM_REPOSITORY,
  type CreateInvoiceLineItemData,
  type InvoiceLineItemInvoiceScope,
  type InvoiceLineItemRecord,
  type InvoiceLineItemRepository,
  type InvoiceLineItemScope,
  type UpdateInvoiceLineItemData,
} from '../repositories/invoice-line-item.repository.interface';
import type {
  CreateInvoiceLineItemCommand,
  InvoiceLineItemApplicationContext,
  UpdateInvoiceLineItemCommand,
} from './invoice-line-item-application.types';

@Injectable()
export class InvoiceLineItemService {
  constructor(
    @Inject(INVOICE_LINE_ITEM_REPOSITORY)
    private readonly invoiceLineItemRepository: InvoiceLineItemRepository,
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceService: InvoiceService,
    private readonly invoiceLineItemDomainService: InvoiceLineItemDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listLineItems(
    scope: InvoiceScope,
    invoiceId: string,
  ): Promise<readonly InvoiceLineItemRecord[]> {
    await this.requireInvoiceForRead(scope, invoiceId);

    return this.invoiceLineItemRepository.listByInvoice(this.toInvoiceScope(scope, invoiceId));
  }

  async createLineItem(
    scope: InvoiceScope,
    invoiceId: string,
    command: CreateInvoiceLineItemCommand,
    context: InvoiceLineItemApplicationContext,
  ): Promise<InvoiceLineItemRecord> {
    await this.requireInvoiceForMutation(scope, invoiceId);

    this.invoiceLineItemDomainService.validateCreate({
      name: command.name,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount: command.discount,
      tax: command.tax,
      sortOrder: command.sortOrder,
    });

    const discount = command.discount ?? 0;
    const tax = command.tax ?? 0;
    const total = calculateLineItemTotal({
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount,
      tax,
    });

    const invoiceScope = this.toInvoiceScope(scope, invoiceId);
    const sortOrder =
      command.sortOrder ?? (await this.invoiceLineItemRepository.getMaxSortOrder(invoiceScope)) + 1;

    const now = new Date();

    const data: CreateInvoiceLineItemData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      invoiceId,
      name: this.invoiceLineItemDomainService.normalizeName(command.name),
      description: this.invoiceLineItemDomainService.normalizeOptionalDescription(
        command.description,
      ),
      quantity: command.quantity,
      unit: this.invoiceLineItemDomainService.normalizeOptionalUnit(command.unit),
      unitPrice: command.unitPrice,
      discount,
      tax,
      total,
      sortOrder,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const created = await this.invoiceLineItemRepository.create(data);
      await this.invoiceService.recalculateInvoiceTotals(scope, invoiceId, {
        actorUserId: context.actorUserId,
      });
      return created;
    });
  }

  async updateLineItem(
    scope: InvoiceLineItemScope,
    lineItemId: string,
    command: UpdateInvoiceLineItemCommand,
    context: InvoiceLineItemApplicationContext,
  ): Promise<InvoiceLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireInvoiceForMutation(scope, existing.invoiceId);

    this.invoiceLineItemDomainService.validateUpdate(existing, {
      name: command.name,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount: command.discount,
      tax: command.tax,
      sortOrder: command.sortOrder,
    });

    const quantity = command.quantity ?? existing.quantity;
    const unitPrice = command.unitPrice ?? existing.unitPrice;
    const discount = command.discount ?? existing.discount;
    const tax = command.tax ?? existing.tax;
    const total = calculateLineItemTotal({ quantity, unitPrice, discount, tax });

    const now = new Date();

    const data: UpdateInvoiceLineItemData = {
      ...(command.name !== undefined
        ? { name: this.invoiceLineItemDomainService.normalizeName(command.name) }
        : {}),
      ...(command.description !== undefined
        ? {
            description: this.invoiceLineItemDomainService.normalizeOptionalDescription(
              command.description,
            ),
          }
        : {}),
      ...(command.quantity !== undefined ? { quantity: command.quantity } : {}),
      ...(command.unit !== undefined
        ? { unit: this.invoiceLineItemDomainService.normalizeOptionalUnit(command.unit) }
        : {}),
      ...(command.unitPrice !== undefined ? { unitPrice: command.unitPrice } : {}),
      ...(command.discount !== undefined ? { discount: command.discount } : {}),
      ...(command.tax !== undefined ? { tax: command.tax } : {}),
      ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
      total,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.invoiceLineItemRepository.update(scope, lineItemId, data);

      if (updated === null) {
        throw new InvoiceLineItemDomainError(
          INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.invoiceService.recalculateInvoiceTotals(scope, existing.invoiceId, {
        actorUserId: context.actorUserId,
      });

      return updated;
    });
  }

  async deleteLineItem(
    scope: InvoiceLineItemScope,
    lineItemId: string,
    context: InvoiceLineItemApplicationContext,
  ): Promise<InvoiceLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireInvoiceForMutation(scope, existing.invoiceId);
    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.invoiceLineItemRepository.softDelete(scope, lineItemId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new InvoiceLineItemDomainError(
          INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.invoiceService.recalculateInvoiceTotals(scope, existing.invoiceId, {
        actorUserId: context.actorUserId,
      });

      return deleted;
    });
  }

  private async requireInvoiceForRead(scope: InvoiceScope, invoiceId: string): Promise<void> {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId);

    if (invoice === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }
  }

  private async requireInvoiceForMutation(scope: InvoiceScope, invoiceId: string) {
    const invoice = await this.invoiceRepository.findById(scope, invoiceId);

    if (invoice === null) {
      throw new InvoiceDomainError(
        INVOICE_DOMAIN_ERROR_CODES.INVOICE_NOT_FOUND,
        'Invoice was not found.',
      );
    }

    this.invoiceLineItemDomainService.assertInvoiceIsActive(invoice);
    return invoice;
  }

  private async requireLineItem(
    scope: InvoiceLineItemScope,
    lineItemId: string,
  ): Promise<InvoiceLineItemRecord> {
    const lineItem = await this.invoiceLineItemRepository.findById(scope, lineItemId);

    if (lineItem === null) {
      throw new InvoiceLineItemDomainError(
        INVOICE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
        'Line item was not found.',
      );
    }

    return lineItem;
  }

  private toInvoiceScope(scope: InvoiceScope, invoiceId: string): InvoiceLineItemInvoiceScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      invoiceId,
    };
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}
