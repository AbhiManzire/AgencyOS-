import type { PurchaseBillStatus } from '@/features/finance/shared/finance.types';

export interface PurchaseBillRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status: PurchaseBillStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly notes: string | null;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListPurchaseBillsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly q?: string;
  readonly vendorId?: string;
  readonly status?: PurchaseBillStatus;
  readonly includeArchived?: boolean;
  readonly sortBy?: 'updatedAt' | 'createdAt' | 'issueDate' | 'dueDate' | 'billNumber';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface ListPurchaseBillsResult {
  readonly items: readonly PurchaseBillRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreatePurchaseBillPayload {
  readonly vendorId: string;
  readonly billNumber: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency?: string;
  readonly notes?: string | null;
}

export interface UpdatePurchaseBillPayload {
  readonly vendorId?: string;
  readonly billNumber?: string;
  readonly status?: PurchaseBillStatus;
  readonly issueDate?: string;
  readonly dueDate?: string;
  readonly currency?: string;
  readonly notes?: string | null;
}
