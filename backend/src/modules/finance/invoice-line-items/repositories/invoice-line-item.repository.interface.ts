export const INVOICE_LINE_ITEM_REPOSITORY = Symbol('INVOICE_LINE_ITEM_REPOSITORY');

export interface InvoiceLineItemScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface InvoiceLineItemInvoiceScope extends InvoiceLineItemScope {
  readonly invoiceId: string;
}

export interface InvoiceLineItemRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly invoiceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly quantity: number;
  readonly unit: string | null;
  readonly unitPrice: number;
  readonly discount: number;
  readonly tax: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateInvoiceLineItemData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly invoiceId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total: number;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateInvoiceLineItemData {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly total?: number;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteInvoiceLineItemData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface InvoiceLineItemRepository {
  create(data: CreateInvoiceLineItemData): Promise<InvoiceLineItemRecord>;
  update(
    scope: InvoiceLineItemScope,
    id: string,
    data: UpdateInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord | null>;
  softDelete(
    scope: InvoiceLineItemScope,
    id: string,
    data: SoftDeleteInvoiceLineItemData,
  ): Promise<InvoiceLineItemRecord | null>;
  findById(scope: InvoiceLineItemScope, id: string): Promise<InvoiceLineItemRecord | null>;
  listByInvoice(scope: InvoiceLineItemInvoiceScope): Promise<readonly InvoiceLineItemRecord[]>;
  getMaxSortOrder(scope: InvoiceLineItemInvoiceScope): Promise<number>;
}
