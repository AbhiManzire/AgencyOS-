import type { ApprovalStatus, InvoiceStatus, TaxMode } from '@prisma/client';

export const INVOICE_REPOSITORY = Symbol('INVOICE_REPOSITORY');

export interface InvoiceScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

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
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency: string;
  readonly notes: string | null;
  readonly terms: string | null;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly subtotal: number;
  readonly grandTotal: number;
  readonly balanceDue: number;
  readonly taxMode: TaxMode;
  readonly viewedAt: Date | null;
  readonly approvalStatus: ApprovalStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateInvoiceData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly projectId: string;
  readonly quoteId?: string | null;
  readonly dealId?: string | null;
  readonly invoiceNumber: string;
  readonly status?: InvoiceStatus;
  readonly issueDate: Date;
  readonly dueDate: Date;
  readonly currency?: string;
  readonly notes?: string | null;
  readonly terms?: string | null;
  readonly discountAmount?: number;
  readonly taxAmount?: number;
  readonly subtotal?: number;
  readonly grandTotal?: number;
  readonly balanceDue?: number;
  readonly taxMode?: TaxMode;
  readonly viewedAt?: Date | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateInvoiceData {
  readonly clientId?: string;
  readonly projectId?: string;
  readonly quoteId?: string | null;
  readonly dealId?: string | null;
  readonly invoiceNumber?: string;
  readonly status?: InvoiceStatus;
  readonly issueDate?: Date;
  readonly dueDate?: Date;
  readonly currency?: string;
  readonly notes?: string | null;
  readonly terms?: string | null;
  readonly discountAmount?: number;
  readonly taxAmount?: number;
  readonly subtotal?: number;
  readonly grandTotal?: number;
  readonly balanceDue?: number;
  readonly taxMode?: TaxMode;
  readonly viewedAt?: Date | null;
  readonly approvalStatus?: ApprovalStatus;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface FindInvoiceByIdOptions {
  readonly includeArchived?: boolean;
}

export interface ListInvoicesParams {
  readonly scope: InvoiceScope;
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
}

export interface InvoiceRepository {
  create(data: CreateInvoiceData): Promise<InvoiceRecord>;
  update(scope: InvoiceScope, id: string, data: UpdateInvoiceData): Promise<InvoiceRecord | null>;
  findById(
    scope: InvoiceScope,
    id: string,
    options?: FindInvoiceByIdOptions,
  ): Promise<InvoiceRecord | null>;
  findByInvoiceNumber(scope: InvoiceScope, invoiceNumber: string): Promise<InvoiceRecord | null>;
  list(params: ListInvoicesParams): Promise<ListInvoicesResult>;
}
