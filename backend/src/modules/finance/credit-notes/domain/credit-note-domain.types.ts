import type { CreditNoteStatus } from '@prisma/client';

export interface CreateCreditNoteValidationInput {
  readonly clientId: string;
  readonly creditNoteNumber: string;
  readonly amount: number;
  readonly taxAmount?: number | null;
  readonly currency?: string;
  readonly status?: CreditNoteStatus;
}

export interface ApplyCreditNoteValidationInput {
  readonly amount: number;
  readonly remaining: number;
}
