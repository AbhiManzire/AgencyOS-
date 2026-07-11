import type { PurchaseBillStatus } from '@prisma/client';
import type {
  PurchaseBillRecord,
  PurchaseBillScope,
} from '../repositories/purchase-bill.repository.interface';
import {
  PURCHASE_BILL_DOMAIN_ERROR_CODES,
  PurchaseBillDomainError,
} from './purchase-bill-domain.errors';
import type {
  CreateLineItemValidationInput,
  CreatePurchaseBillValidationInput,
  UpdatePurchaseBillValidationInput,
} from './purchase-bill-domain.types';

const VALID_STATUSES: readonly PurchaseBillStatus[] = [
  'DRAFT',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
];

const PAYABLE_STATUSES: readonly PurchaseBillStatus[] = ['SENT', 'PARTIALLY_PAID', 'OVERDUE'];

export class PurchaseBillDomainService {
  validateCreate(input: CreatePurchaseBillValidationInput): void {
    this.assertVendorRequired(input.vendorId);
    this.assertBillNumberRequired(input.billNumber);
    this.assertDateRange(input.issueDate, input.dueDate);
    if (input.status !== undefined) this.assertValidStatus(input.status);
    if (input.currency !== undefined) this.assertCurrencyValid(input.currency);
  }

  validateUpdate(bill: PurchaseBillRecord, input: UpdatePurchaseBillValidationInput): void {
    this.assertBillIsActive(bill);
    if (input.vendorId !== undefined) this.assertVendorRequired(input.vendorId);
    if (input.billNumber !== undefined) this.assertBillNumberRequired(input.billNumber);
    if (input.status !== undefined) this.assertValidStatus(input.status);
    if (input.currency !== undefined) this.assertCurrencyValid(input.currency);
    const issueDate = input.issueDate ?? bill.issueDate;
    const dueDate = input.dueDate ?? bill.dueDate;
    this.assertDateRange(issueDate, dueDate);
  }

  validateArchive(bill: PurchaseBillRecord): void {
    this.assertBillIsActive(bill);
  }

  validateLineItem(input: CreateLineItemValidationInput): void {
    if (input.name.trim().length === 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.LINE_ITEM_NAME_REQUIRED,
        'Line item name is required.',
      );
    }
    if (!Number.isFinite(input.quantity) || input.quantity < 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_LINE_AMOUNT,
        'Quantity must be a non-negative number.',
      );
    }
    if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_LINE_AMOUNT,
        'Unit price must be a non-negative number.',
      );
    }
  }

  validatePayment(bill: PurchaseBillRecord, amount: number, outstanding: number): void {
    this.assertBillIsActive(bill);
    if (!PAYABLE_STATUSES.includes(bill.status) && bill.status !== 'DRAFT') {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_NOT_PAYABLE,
        'Purchase bill is not in a payable status.',
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_PAYMENT_AMOUNT,
        'Payment amount must be a positive number.',
      );
    }
    if (amount > outstanding + 0.001) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.PAYMENT_EXCEEDS_BALANCE,
        'Payment amount exceeds outstanding balance.',
      );
    }
  }

  resolveStatusAfterPayment(grandTotal: number, amountPaid: number): PurchaseBillStatus {
    if (amountPaid <= 0) return 'SENT';
    if (amountPaid + 0.001 >= grandTotal) return 'PAID';
    return 'PARTIALLY_PAID';
  }

  ensureWorkspaceOwnership(scope: PurchaseBillScope, bill: PurchaseBillRecord): void {
    if (bill.tenantId !== scope.tenantId || bill.workspaceId !== scope.workspaceId) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Purchase bill does not belong to the requested workspace.',
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

  computeLineTotal(quantity: number, unitPrice: number, discount = 0, tax = 0): number {
    return Math.round((quantity * unitPrice - discount + tax) * 100) / 100;
  }

  private assertVendorRequired(vendorId: string): void {
    if (!vendorId || vendorId.trim().length === 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.VENDOR_REQUIRED,
        'Vendor is required.',
      );
    }
  }

  private assertBillNumberRequired(billNumber: string): void {
    if (billNumber.trim().length === 0) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_NUMBER_REQUIRED,
        'Bill number is required.',
      );
    }
  }

  private assertValidStatus(status: PurchaseBillStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not valid.`,
      );
    }
  }

  private assertCurrencyValid(currency: string): void {
    if (!/^[A-Z]{3}$/i.test(currency.trim())) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_CURRENCY,
        'Currency must be a 3-letter ISO code.',
      );
    }
  }

  private assertDateRange(issueDate: Date, dueDate: Date): void {
    if (dueDate.getTime() < issueDate.getTime()) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Due date must be on or after issue date.',
      );
    }
  }

  private assertBillIsActive(bill: PurchaseBillRecord): void {
    if (bill.deletedAt !== null) {
      throw new PurchaseBillDomainError(
        PURCHASE_BILL_DOMAIN_ERROR_CODES.BILL_ARCHIVED,
        'Purchase bill is archived and cannot be modified.',
      );
    }
  }
}
