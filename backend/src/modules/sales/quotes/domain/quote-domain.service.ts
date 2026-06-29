import type { QuoteStatus } from '@prisma/client';
import {
  type ClientRepository,
  type ClientScope,
} from '../../../clients/repositories/client.repository.interface';
import {
  type DealRecord,
  type DealRepository,
  type DealScope,
} from '../../deals/repositories/deal.repository.interface';
import type { QuoteRecord } from '../repositories/quote.repository.interface';
import { QUOTE_DOMAIN_ERROR_CODES, QuoteDomainError } from './quote-domain.errors';
import type { CreateQuoteValidationInput, UpdateQuoteValidationInput } from './quote-domain.types';

const VALID_STATUSES: readonly QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

export class QuoteDomainService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly dealRepository: DealRepository,
  ) {}

  validateCreate(input: CreateQuoteValidationInput): void {
    this.assertTitleRequired(input.title);
    this.assertQuoteNumberRequired(input.quoteNumber);
    this.assertTotalAmountValid(input.totalAmount);

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  validateUpdate(quote: QuoteRecord, input: UpdateQuoteValidationInput): void {
    this.assertQuoteIsActive(quote);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.quoteNumber !== undefined) {
      this.assertQuoteNumberRequired(input.quoteNumber);
    }

    if (input.totalAmount !== undefined) {
      this.assertTotalAmountValid(input.totalAmount);
    }

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  async validateClient(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId);

    if (client?.deletedAt != null || client == null) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }
  }

  async validateDeal(scope: DealScope, dealId: string, clientId: string): Promise<DealRecord> {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new QuoteDomainError(QUOTE_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }

    if (deal.deletedAt !== null) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.DEAL_ARCHIVED,
        'Deal is archived and cannot be used for quotes.',
      );
    }

    if (deal.clientId !== clientId) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.DEAL_CLIENT_MISMATCH,
        'Deal does not belong to the selected client.',
      );
    }

    return deal;
  }

  normalizeTitle(title: string): string {
    return title.trim();
  }

  normalizeQuoteNumber(quoteNumber: string): string {
    return quoteNumber.trim().toUpperCase();
  }

  normalizeOptionalNotes(notes: string | null | undefined): string | null {
    if (notes === undefined || notes === null) {
      return null;
    }

    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  generateQuoteNumber(): string {
    const suffix = Date.now().toString(36).toUpperCase().slice(-8);
    return `QUO-${suffix}`;
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.TITLE_REQUIRED,
        'Quote title is required.',
      );
    }
  }

  private assertQuoteNumberRequired(quoteNumber: string): void {
    if (quoteNumber.trim().length === 0) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.QUOTE_NUMBER_REQUIRED,
        'Quote number is required.',
      );
    }
  }

  private assertTotalAmountValid(totalAmount: number): void {
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.INVALID_TOTAL_AMOUNT,
        'Total amount must be a non-negative number.',
      );
    }
  }

  private assertStatusValid(status: QuoteStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Quote status is invalid.',
      );
    }
  }

  private assertQuoteIsActive(quote: QuoteRecord): void {
    if (quote.deletedAt !== null) {
      throw new QuoteDomainError(
        QUOTE_DOMAIN_ERROR_CODES.QUOTE_ARCHIVED,
        'Quote is archived and cannot be modified.',
      );
    }
  }
}
