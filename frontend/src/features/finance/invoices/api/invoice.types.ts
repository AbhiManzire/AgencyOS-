import type {
  ApprovalStatus,
  InvoiceStatus,
  TaxMode,
} from '@/features/finance/shared/finance.types';

export interface InvoiceRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly clientName: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly quoteId: string | null;
  readonly quoteNumber: string | null;
  readonly dealId: string | null;
  readonly invoiceNumber: string;
  readonly status: InvoiceStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly notes: string | null;
  readonly terms: string | null;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly subtotal: number;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly taxMode: TaxMode;
  readonly viewedAt: string | null;
  readonly approvalStatus: ApprovalStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListInvoicesParams {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: InvoiceStatus;
  readonly clientId?: string;
  readonly projectId?: string;
  readonly quoteId?: string;
  readonly includeArchived?: boolean;
}

export interface ListInvoicesResult {
  readonly items: readonly InvoiceRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateInvoicePayload {
  readonly clientId: string;
  readonly projectId: string;
  readonly quoteId?: string | null;
  readonly dealId?: string | null;
  readonly invoiceNumber?: string;
  readonly status?: InvoiceStatus;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency?: string;
  readonly notes?: string | null;
  readonly terms?: string | null;
  readonly taxMode?: TaxMode;
  readonly discountAmount?: number;
  readonly approvalStatus?: ApprovalStatus;
}

export interface UpdateInvoicePayload {
  readonly clientId?: string;
  readonly projectId?: string;
  readonly quoteId?: string | null;
  readonly dealId?: string | null;
  readonly invoiceNumber?: string;
  readonly status?: InvoiceStatus;
  readonly issueDate?: string;
  readonly dueDate?: string;
  readonly currency?: string;
  readonly notes?: string | null;
  readonly terms?: string | null;
  readonly taxMode?: TaxMode;
  readonly discountAmount?: number;
  readonly approvalStatus?: ApprovalStatus;
}
