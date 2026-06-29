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
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreateInvoiceLineItemPayload {
  readonly name: string;
  readonly description?: string | null;
  readonly quantity: number;
  readonly unit?: string | null;
  readonly unitPrice: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}

export interface UpdateInvoiceLineItemPayload {
  readonly name?: string;
  readonly description?: string | null;
  readonly quantity?: number;
  readonly unit?: string | null;
  readonly unitPrice?: number;
  readonly discount?: number;
  readonly tax?: number;
  readonly sortOrder?: number;
}
