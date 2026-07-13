import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { roundMoney } from '../../pricing/pricing-engine';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from '../../deals/domain/deal-domain.errors';
import {
  DEAL_REPOSITORY,
  type DealRepository,
  type DealScope,
} from '../../deals/repositories/deal.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { DealLineItemDomainService } from '../domain/deal-line-item-domain.service';
import {
  DEAL_LINE_ITEM_DOMAIN_ERROR_CODES,
  DealLineItemDomainError,
} from '../domain/deal-line-item-domain.errors';
import {
  DEAL_LINE_ITEM_REPOSITORY,
  type CreateDealLineItemData,
  type DealLineItemDealScope,
  type DealLineItemRecord,
  type DealLineItemRepository,
  type DealLineItemScope,
  type UpdateDealLineItemData,
} from '../repositories/deal-line-item.repository.interface';
import type {
  CreateDealLineItemCommand,
  DealLineItemApplicationContext,
  UpdateDealLineItemCommand,
} from './deal-line-item-application.types';

@Injectable()
export class DealLineItemService {
  constructor(
    @Inject(DEAL_LINE_ITEM_REPOSITORY)
    private readonly dealLineItemRepository: DealLineItemRepository,
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    private readonly dealLineItemDomainService: DealLineItemDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listLineItems(scope: DealScope, dealId: string): Promise<readonly DealLineItemRecord[]> {
    await this.requireDealForRead(scope, dealId);
    return this.dealLineItemRepository.listByDeal(this.toDealScope(scope, dealId));
  }

  async createLineItem(
    scope: DealScope,
    dealId: string,
    command: CreateDealLineItemCommand,
    context: DealLineItemApplicationContext,
  ): Promise<DealLineItemRecord> {
    await this.requireDealForMutation(scope, dealId);

    this.dealLineItemDomainService.validateCreate({
      name: command.name,
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount: command.discount,
      tax: command.tax,
      sortOrder: command.sortOrder,
    });

    const discount = command.discount ?? 0;
    const tax = command.tax ?? 0;
    const { subtotal, total } = calculateDealLinePricing({
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount,
      tax,
    });

    const dealScope = this.toDealScope(scope, dealId);
    const sortOrder =
      command.sortOrder ?? (await this.dealLineItemRepository.getMaxSortOrder(dealScope)) + 1;
    const now = new Date();

    const data: CreateDealLineItemData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId,
      name: this.dealLineItemDomainService.normalizeName(command.name),
      description: this.dealLineItemDomainService.normalizeOptionalDescription(command.description),
      quantity: command.quantity,
      unitPrice: command.unitPrice,
      discount,
      tax,
      subtotal,
      total,
      sortOrder,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const lineItem = await this.dealLineItemRepository.create(data);
      await this.syncDealValue(scope, dealId, context, now);
      return lineItem;
    });
  }

  async updateLineItem(
    scope: DealLineItemScope,
    lineItemId: string,
    command: UpdateDealLineItemCommand,
    context: DealLineItemApplicationContext,
  ): Promise<DealLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireDealForMutation(scope, existing.dealId);

    this.dealLineItemDomainService.validateUpdate(existing, {
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
    const { subtotal, total } = calculateDealLinePricing({ quantity, unitPrice, discount, tax });
    const now = new Date();

    const data: UpdateDealLineItemData = {
      ...(command.name !== undefined
        ? { name: this.dealLineItemDomainService.normalizeName(command.name) }
        : {}),
      ...(command.description !== undefined
        ? {
            description: this.dealLineItemDomainService.normalizeOptionalDescription(
              command.description,
            ),
          }
        : {}),
      ...(command.quantity !== undefined ? { quantity: command.quantity } : {}),
      ...(command.unitPrice !== undefined ? { unitPrice: command.unitPrice } : {}),
      ...(command.discount !== undefined ? { discount: command.discount } : {}),
      ...(command.tax !== undefined ? { tax: command.tax } : {}),
      ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
      subtotal,
      total,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.dealLineItemRepository.update(scope, lineItemId, data);

      if (updated === null) {
        throw new DealLineItemDomainError(
          DEAL_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.syncDealValue(scope, existing.dealId, context, now);
      return updated;
    });
  }

  async deleteLineItem(
    scope: DealLineItemScope,
    lineItemId: string,
    context: DealLineItemApplicationContext,
  ): Promise<DealLineItemRecord> {
    const existing = await this.requireLineItem(scope, lineItemId);
    await this.requireDealForMutation(scope, existing.dealId);
    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.dealLineItemRepository.softDelete(scope, lineItemId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new DealLineItemDomainError(
          DEAL_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
          'Line item was not found.',
        );
      }

      await this.syncDealValue(scope, existing.dealId, context, now);
      return deleted;
    });
  }

  private async syncDealValue(
    scope: DealScope,
    dealId: string,
    context: DealLineItemApplicationContext,
    updatedAt: Date,
  ): Promise<void> {
    const lineItems = await this.dealLineItemRepository.listByDeal(this.toDealScope(scope, dealId));

    if (lineItems.length === 0) {
      return;
    }

    const value = roundMoney(lineItems.reduce((sum, item) => sum + item.total, 0));
    await this.dealRepository.update(scope, dealId, {
      value,
      updatedAt,
      updatedByUserId: context.actorUserId,
    });
  }

  private async requireDealForRead(scope: DealScope, dealId: string): Promise<void> {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }
  }

  private async requireDealForMutation(scope: DealScope, dealId: string) {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    this.dealLineItemDomainService.assertDealIsActive(deal);
    return deal;
  }

  private async requireLineItem(
    scope: DealLineItemScope,
    lineItemId: string,
  ): Promise<DealLineItemRecord> {
    const lineItem = await this.dealLineItemRepository.findById(scope, lineItemId);

    if (lineItem === null) {
      throw new DealLineItemDomainError(
        DEAL_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_NOT_FOUND,
        'Line item was not found.',
      );
    }

    return lineItem;
  }

  private toDealScope(scope: DealScope, dealId: string): DealLineItemDealScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId,
    };
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function calculateDealLinePricing(input: {
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}): { subtotal: number; total: number } {
  const gross = roundMoney(input.quantity * input.unitPrice);
  const subtotal = roundMoney(Math.max(0, gross - input.discount));
  const total = roundMoney(subtotal + input.tax);
  return { subtotal, total };
}
