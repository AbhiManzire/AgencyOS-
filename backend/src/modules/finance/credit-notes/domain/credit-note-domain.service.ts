import type { CreditNoteStatus } from '@prisma/client';
import type {
  CreditNoteRecord,
  CreditNoteScope,
} from '../repositories/credit-note.repository.interface';
import { CREDIT_NOTE_DOMAIN_ERROR_CODES, CreditNoteDomainError } from './credit-note-domain.errors';
import type {
  ApplyCreditNoteValidationInput,
  CreateCreditNoteValidationInput,
} from './credit-note-domain.types';

const VALID_STATUSES: readonly CreditNoteStatus[] = ['DRAFT', 'ISSUED', 'APPLIED', 'VOID'];

export class CreditNoteDomainService {
  validateCreate(input: CreateCreditNoteValidationInput): void {
    if (!input.clientId || input.clientId.trim().length === 0) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.CLIENT_REQUIRED,
        'Client is required.',
      );
    }
    if (input.creditNoteNumber.trim().length === 0) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.NUMBER_REQUIRED,
        'Credit note number is required.',
      );
    }
    this.assertAmountValid(input.amount);
    if (input.taxAmount !== undefined && input.taxAmount !== null) {
      this.assertAmountValid(input.taxAmount);
    }
    if (input.currency !== undefined) {
      this.assertCurrencyValid(input.currency);
    }
    if (input.status !== undefined && !VALID_STATUSES.includes(input.status)) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Credit note status is invalid.',
      );
    }
  }

  validateApply(note: CreditNoteRecord, input: ApplyCreditNoteValidationInput): void {
    this.assertActive(note);
    if (note.status === 'VOID') {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.ALREADY_VOIDED,
        'Credit note is voided.',
      );
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.INVALID_AMOUNT,
        'Apply amount must be positive.',
      );
    }
    if (input.amount > input.remaining + 0.001) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.APPLY_AMOUNT_EXCEEDS,
        'Apply amount exceeds remaining credit.',
      );
    }
  }

  validateVoid(note: CreditNoteRecord): void {
    this.assertActive(note);
    if (note.status === 'VOID') {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.ALREADY_VOIDED,
        'Credit note is already voided.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: CreditNoteScope, note: CreditNoteRecord): void {
    if (note.tenantId !== scope.tenantId || note.workspaceId !== scope.workspaceId) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Credit note does not belong to the requested workspace.',
      );
    }
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeCurrency(value: string | undefined): string {
    return (value ?? 'USD').trim().toUpperCase();
  }

  private assertAmountValid(amount: number): void {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.INVALID_AMOUNT,
        'Amount must be a non-negative number.',
      );
    }
  }

  private assertCurrencyValid(currency: string): void {
    if (!/^[A-Z]{3}$/i.test(currency.trim())) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.INVALID_AMOUNT,
        'Currency must be a 3-letter ISO code.',
      );
    }
  }

  private assertActive(note: CreditNoteRecord): void {
    if (note.deletedAt !== null) {
      throw new CreditNoteDomainError(
        CREDIT_NOTE_DOMAIN_ERROR_CODES.CREDIT_NOTE_ARCHIVED,
        'Credit note is archived.',
      );
    }
  }
}
