import type { CreditNoteStatus } from '@prisma/client';
import type {
  CreditNoteApplicationRecord,
  CreditNoteRecord,
  CreditNoteScope,
  ListCreditNotesResult,
} from '../repositories/credit-note.repository.interface';

export interface CreditNoteApplicationContext {
  readonly actorUserId: string;
}

export interface CreateCreditNoteCommand {
  readonly clientId: string;
  readonly invoiceId?: string | null;
  readonly creditNoteNumber: string;
  readonly issueDate: Date;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly status?: CreditNoteStatus;
  readonly notes?: string | null;
}

export interface ApplyCreditNoteCommand {
  readonly invoiceId: string;
  readonly amount: number;
}

export interface ListCreditNotesQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly clientId?: string;
  readonly invoiceId?: string;
  readonly status?: CreditNoteStatus;
  readonly includeArchived?: boolean;
}

export type {
  CreditNoteRecord,
  CreditNoteScope,
  ListCreditNotesResult,
  CreditNoteApplicationRecord,
};
