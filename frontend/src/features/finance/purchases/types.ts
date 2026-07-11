import type { PurchaseBillStatus } from '@/features/finance/shared/finance.types';

export type { PurchaseBillStatus };

export interface PurchaseBillFormValues {
  vendorId: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  notes: string;
  status: PurchaseBillStatus;
}

export interface PurchaseBillFormErrors {
  vendorId?: string;
  billNumber?: string;
  issueDate?: string;
  dueDate?: string;
  currency?: string;
  form?: string;
}

export interface PurchaseBillListItem {
  readonly id: string;
  readonly vendorId: string;
  readonly vendorName: string;
  readonly billNumber: string;
  readonly status: PurchaseBillStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly updatedAt: string;
}

export interface PurchaseBillLineItemListItem {
  readonly id: string;
  readonly purchaseBillId: string;
  readonly name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unit: string | null;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
  readonly sortOrder: number;
}

export interface PurchaseLineItemFormValues {
  readonly name: string;
  readonly description: string;
  readonly quantity: string;
  readonly unit: string;
  readonly unitPrice: string;
  readonly discount: string;
  readonly tax: string;
}

export interface PurchaseLineItemFormErrors {
  name?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  tax?: string;
  form?: string;
}

export type PurchaseLineItemDrawerMode = 'create' | 'edit';
