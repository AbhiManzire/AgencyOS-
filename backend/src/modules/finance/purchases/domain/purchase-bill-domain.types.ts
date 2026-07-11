import type { PurchaseBillStatus } from '@prisma/client';

export interface CreatePurchaseBillValidationInput {
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status?: PurchaseBillStatus;
  readonly currency?: string;
  readonly issueDate: Date;
  readonly dueDate: Date;
}

export interface UpdatePurchaseBillValidationInput {
  readonly vendorId?: string;
  readonly billNumber?: string;
  readonly status?: PurchaseBillStatus;
  readonly currency?: string;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
}

export interface CreateLineItemValidationInput {
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
}
