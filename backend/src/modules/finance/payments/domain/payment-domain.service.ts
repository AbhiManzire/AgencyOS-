import type { InvoiceStatus, PaymentMethod } from '@prisma/client';
import { PAYMENT_DOMAIN_ERROR_CODES, PaymentDomainError } from './payment-domain.errors';

const PAYABLE_INVOICE_STATUSES: readonly InvoiceStatus[] = ['SENT', 'OVERDUE', 'PAID'];

export class PaymentDomainService {
  assertAmountValid(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_AMOUNT_INVALID,
        'Payment amount must be greater than zero.',
      );
    }
  }

  assertInvoicePayable(status: InvoiceStatus, deletedAt: Date | null): void {
    if (deletedAt !== null) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.INVOICE_NOT_PAYABLE,
        'Archived invoices cannot accept payments.',
      );
    }

    if (!PAYABLE_INVOICE_STATUSES.includes(status)) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.INVOICE_NOT_PAYABLE,
        `Payments cannot be recorded for invoices in "${status}" status.`,
      );
    }
  }

  assertWithinOutstanding(amount: number, outstanding: number): void {
    if (amount > outstanding + 0.001) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.PAYMENT_EXCEEDS_OUTSTANDING,
        `Payment amount exceeds outstanding balance of ${outstanding.toFixed(2)}.`,
      );
    }
  }

  assertCurrencyMatch(paymentCurrency: string, invoiceCurrency: string): void {
    if (paymentCurrency.trim().toUpperCase() !== invoiceCurrency.trim().toUpperCase()) {
      throw new PaymentDomainError(
        PAYMENT_DOMAIN_ERROR_CODES.CURRENCY_MISMATCH,
        'Payment currency must match the invoice currency.',
      );
    }
  }

  normalizeOptionalText(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  isPaymentMethod(value: string): value is PaymentMethod {
    return (
      value === 'BANK_TRANSFER' ||
      value === 'CARD' ||
      value === 'CASH' ||
      value === 'CHECK' ||
      value === 'OTHER'
    );
  }

  /** Derives invoice status after payment totals change. */
  resolveInvoiceStatusAfterPayment(params: {
    readonly currentStatus: InvoiceStatus;
    readonly dueDate: Date;
    readonly outstanding: number;
  }): InvoiceStatus {
    if (params.outstanding <= 0.001) {
      return 'PAID';
    }

    if (params.currentStatus === 'VOID' || params.currentStatus === 'DRAFT') {
      return params.currentStatus;
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    if (params.dueDate.getTime() < startOfToday.getTime()) {
      return 'OVERDUE';
    }

    return 'SENT';
  }
}
