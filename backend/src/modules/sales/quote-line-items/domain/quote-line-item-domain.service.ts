import type { QuoteRecord } from '../../quotes/repositories/quote.repository.interface';
import {
  QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES,
  QuoteLineItemDomainError,
} from './quote-line-item-domain.errors';
import type {
  CreateQuoteLineItemValidationInput,
  UpdateQuoteLineItemValidationInput,
} from './quote-line-item-domain.types';

export class QuoteLineItemDomainService {
  validateCreate(input: CreateQuoteLineItemValidationInput): void {
    this.assertNameRequired(input.name);
    this.assertQuantityValid(input.quantity);
    this.assertUnitPriceValid(input.unitPrice);
    this.assertDiscountValid(input.discount ?? 0);
    this.assertTaxValid(input.tax ?? 0);

    if (input.sortOrder !== undefined) {
      this.assertSortOrderValid(input.sortOrder);
    }
  }

  validateUpdate(
    lineItem: { deletedAt: Date | null },
    input: UpdateQuoteLineItemValidationInput,
  ): void {
    this.assertLineItemIsActive(lineItem);

    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }

    if (input.quantity !== undefined) {
      this.assertQuantityValid(input.quantity);
    }

    if (input.unitPrice !== undefined) {
      this.assertUnitPriceValid(input.unitPrice);
    }

    if (input.discount !== undefined) {
      this.assertDiscountValid(input.discount);
    }

    if (input.tax !== undefined) {
      this.assertTaxValid(input.tax);
    }

    if (input.sortOrder !== undefined) {
      this.assertSortOrderValid(input.sortOrder);
    }
  }

  assertQuoteIsActive(quote: QuoteRecord): void {
    if (quote.deletedAt !== null) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.QUOTE_ARCHIVED,
        'Quote is archived and cannot be modified.',
      );
    }
  }

  normalizeName(name: string): string {
    return name.trim();
  }

  normalizeOptionalDescription(description: string | null | undefined): string | null {
    if (description === undefined || description === null) {
      return null;
    }

    const trimmed = description.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeOptionalUnit(unit: string | null | undefined): string | null {
    if (unit === undefined || unit === null) {
      return null;
    }

    const trimmed = unit.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.NAME_REQUIRED,
        'Line item name is required.',
      );
    }
  }

  private assertQuantityValid(quantity: number): void {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.INVALID_QUANTITY,
        'Quantity must be greater than zero.',
      );
    }
  }

  private assertUnitPriceValid(unitPrice: number): void {
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.INVALID_UNIT_PRICE,
        'Unit price must be a non-negative number.',
      );
    }
  }

  private assertDiscountValid(discount: number): void {
    if (!Number.isFinite(discount) || discount < 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.INVALID_DISCOUNT,
        'Discount must be a non-negative number.',
      );
    }
  }

  private assertTaxValid(tax: number): void {
    if (!Number.isFinite(tax) || tax < 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.INVALID_TAX,
        'Tax must be a non-negative number.',
      );
    }
  }

  private assertSortOrderValid(sortOrder: number): void {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.INVALID_SORT_ORDER,
        'Sort order must be a non-negative integer.',
      );
    }
  }

  private assertLineItemIsActive(lineItem: { deletedAt: Date | null }): void {
    if (lineItem.deletedAt !== null) {
      throw new QuoteLineItemDomainError(
        QUOTE_LINE_ITEM_DOMAIN_ERROR_CODES.LINE_ITEM_ARCHIVED,
        'Line item is archived and cannot be modified.',
      );
    }
  }
}
