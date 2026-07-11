import type { ApprovalStatus, PaymentMethod, PurchaseBillStatus } from '@prisma/client';
import type {
  ListPurchaseBillsResult,
  PurchaseBillListSortField,
  PurchaseBillRecord,
  PurchaseBillScope,
} from '../repositories/purchase-bill.repository.interface';
import type { PurchaseBillLineItemRecord } from '../repositories/purchase-bill-line-item.repository.interface';
import type { PurchasePaymentRecord } from '../repositories/purchase-payment.repository.interface';

export interface PurchaseApplicationContext {
  readonly actorUserId: string;
}

export interface CreatePurchaseBillCommand {
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface UpdatePurchaseBillCommand {
  readonly vendorId?: string;
  readonly billNumber?: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface ListPurchaseBillsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly vendorId?: string;
  readonly status?: PurchaseBillStatus;
  readonly includeArchived?: boolean;
  readonly sortBy?: PurchaseBillListSortField;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface CreatePurchaseBillLineItemCommand {
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdatePurchaseBillLineItemCommand {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface CreatePurchasePaymentCommand {
  readonly amount: number;
  readonly currency?: string;
  readonly method: PaymentMethod;
  readonly paidAt: Date;
  readonly reference?: string | null;
  readonly notes?: string | null;
  readonly approvalStatus?: ApprovalStatus;
}

export type {
  PurchaseBillRecord,
  PurchaseBillScope,
  ListPurchaseBillsResult,
  PurchaseBillLineItemRecord,
  PurchasePaymentRecord,
};
