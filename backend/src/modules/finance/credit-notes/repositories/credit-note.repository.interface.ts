import type { CreditNoteStatus, Prisma } from '@prisma/client';

export const CREDIT_NOTE_REPOSITORY = Symbol('CREDIT_NOTE_REPOSITORY');
export const CREDIT_NOTE_APPLICATION_REPOSITORY = Symbol('CREDIT_NOTE_APPLICATION_REPOSITORY');

export interface CreditNoteScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export type CreditNoteTransactionClient = Prisma.TransactionClient;

export interface CreditNoteRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly invoiceId: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: Date;
  readonly amount: number;
  readonly taxAmount: number | null;
  readonly currency: string;
  readonly status: CreditNoteStatus;
  readonly appliedAmount: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreditNoteApplicationRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly creditNoteId: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly appliedAt: Date;
  readonly createdAt: Date;
  readonly createdByUserId: string | null;
}

export interface CreateCreditNoteData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly clientId: string;
  readonly invoiceId?: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: Date;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency: string;
  readonly status?: CreditNoteStatus;
  readonly appliedAmount?: number;
  readonly notes?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateCreditNoteData {
  readonly status?: CreditNoteStatus;
  readonly appliedAmount?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface CreateCreditNoteApplicationData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly creditNoteId: string;
  readonly invoiceId: string;
  readonly amount: number;
  readonly appliedAt: Date;
  readonly createdAt: Date;
  readonly createdByUserId?: string | null;
}

export interface ListCreditNotesParams {
  readonly scope: CreditNoteScope;
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
}

export interface CreditNoteRepository {
  create(data: CreateCreditNoteData, tx?: CreditNoteTransactionClient): Promise<CreditNoteRecord>;
  update(
    scope: CreditNoteScope,
    id: string,
    data: UpdateCreditNoteData,
    tx?: CreditNoteTransactionClient,
  ): Promise<CreditNoteRecord | null>;
  findById(scope: CreditNoteScope, id: string): Promise<CreditNoteRecord | null>;
  list(params: ListCreditNotesParams): Promise<ListCreditNotesResult>;
}

export interface CreditNoteApplicationRepository {
  create(
    data: CreateCreditNoteApplicationData,
    tx?: CreditNoteTransactionClient,
  ): Promise<CreditNoteApplicationRecord>;
}
