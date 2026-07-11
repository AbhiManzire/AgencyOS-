import { CreatePurchaseBillDto } from '../dto/create-purchase-bill.dto';
import {
  CreatePurchaseBillLineItemDto,
  UpdatePurchaseBillLineItemDto,
} from '../dto/create-purchase-bill-line-item.dto';
import { CreatePurchasePaymentDto } from '../dto/create-purchase-payment.dto';
import { ListPurchaseBillsQueryDto } from '../dto/list-purchase-bills-query.dto';
import { UpdatePurchaseBillDto } from '../dto/update-purchase-bill.dto';
import type {
  CreatePurchaseBillCommand,
  CreatePurchaseBillLineItemCommand,
  CreatePurchasePaymentCommand,
  ListPurchaseBillsQuery,
  UpdatePurchaseBillCommand,
  UpdatePurchaseBillLineItemCommand,
} from '../services/purchase-application.types';

/** Maps HTTP DTOs to application commands and queries — no business logic. */
export const PurchaseBillMapper = {
  toCreateBillCommand(dto: CreatePurchaseBillDto): CreatePurchaseBillCommand {
    return {
      vendorId: dto.vendorId,
      billNumber: dto.billNumber,
      status: dto.status,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      notes: dto.notes,
    };
  },

  toUpdateBillCommand(dto: UpdatePurchaseBillDto): UpdatePurchaseBillCommand {
    return {
      vendorId: dto.vendorId,
      billNumber: dto.billNumber,
      status: dto.status,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      notes: dto.notes,
    };
  },

  toListBillsQuery(dto: ListPurchaseBillsQueryDto): ListPurchaseBillsQuery {
    return {
      skip: dto.skip,
      take: dto.take,
      q: dto.q,
      vendorId: dto.vendorId,
      status: dto.status,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };
  },

  toCreateLineItemCommand(dto: CreatePurchaseBillLineItemDto): CreatePurchaseBillLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },

  toUpdateLineItemCommand(dto: UpdatePurchaseBillLineItemDto): UpdatePurchaseBillLineItemCommand {
    return {
      name: dto.name,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      discount: dto.discount,
      tax: dto.tax,
      sortOrder: dto.sortOrder,
    };
  },

  toCreatePaymentCommand(dto: CreatePurchasePaymentDto): CreatePurchasePaymentCommand {
    return {
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      paidAt: dto.paidAt,
      reference: dto.reference,
      notes: dto.notes,
      approvalStatus: dto.approvalStatus,
    };
  },
};
