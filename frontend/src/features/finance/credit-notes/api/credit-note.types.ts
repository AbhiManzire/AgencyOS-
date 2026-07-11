import type { CreditNoteStatus } from '@/features/finance/shared/finance.types';

export interface CreditNoteRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly invoiceId: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: string;
  readonly amount: number;
  readonly taxAmount: number | null;
  readonly currency: string;
  readonly status: CreditNoteStatus;
  readonly appliedAmount: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreditNoteApplicationRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly creditNoteId: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly appliedAt: string;
  readonly createdAt: string;
  readonly createdByUserId: string | null;
}

export interface ListCreditNotesParams {
  readonly skip?: number;
  readonly take?: number;
  readonly clientId?: string;
  readonly invoiceId?: string;
  readonly status?: CreditNoteStatus;
  readonly includeArchived?: boolean;
}

export interface ListCreditNotesResult {
  readonly items: readonly CreditNoteRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateCreditNotePayload {
  readonly clientId: string;
  readonly invoiceId?: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: string;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly status?: CreditNoteStatus;
  readonly notes?: string | null;
}

export interface ApplyCreditNotePayload {
  readonly invoiceId: string;
  readonly amount: number;
}

export interface ApplyCreditNoteResult {
  readonly note: CreditNoteRecord;
  readonly application: CreditNoteApplicationRecord;
}
