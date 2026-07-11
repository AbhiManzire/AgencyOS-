import type { VendorRecord, VendorScope } from '../repositories/vendor.repository.interface';
import { VENDOR_DOMAIN_ERROR_CODES, VendorDomainError } from './vendor-domain.errors';
import type {
  CreateVendorValidationInput,
  UpdateVendorValidationInput,
} from './vendor-domain.types';

export class VendorDomainService {
  validateCreate(input: CreateVendorValidationInput): void {
    this.assertNameRequired(input.name);
    if (input.currency !== undefined) {
      this.assertCurrencyValid(input.currency);
    }
    if (input.paymentTermsDays !== undefined && input.paymentTermsDays !== null) {
      this.assertPaymentTermsValid(input.paymentTermsDays);
    }
  }

  validateUpdate(vendor: VendorRecord, input: UpdateVendorValidationInput): void {
    this.assertVendorIsActive(vendor);
    if (input.name !== undefined) {
      this.assertNameRequired(input.name);
    }
    if (input.currency !== undefined) {
      this.assertCurrencyValid(input.currency);
    }
    if (input.paymentTermsDays !== undefined && input.paymentTermsDays !== null) {
      this.assertPaymentTermsValid(input.paymentTermsDays);
    }
  }

  validateArchive(vendor: VendorRecord): void {
    this.assertVendorIsActive(vendor);
  }

  validateRestore(vendor: VendorRecord): void {
    if (vendor.deletedAt === null) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.VENDOR_NOT_ARCHIVED,
        'Vendor is not archived.',
      );
    }
  }

  ensureWorkspaceOwnership(scope: VendorScope, vendor: VendorRecord): void {
    if (vendor.tenantId !== scope.tenantId || vendor.workspaceId !== scope.workspaceId) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Vendor does not belong to the requested workspace.',
      );
    }
  }

  normalizeRequiredString(value: string): string {
    return value.trim();
  }

  normalizeOptionalString(value: string | null | undefined): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  normalizeOptionalEmail(value: string | null | undefined): string | null | undefined {
    const normalized = this.normalizeOptionalString(value);
    if (normalized === undefined || normalized === null) {
      return normalized;
    }
    return normalized.toLowerCase();
  }

  normalizeCurrency(value: string | undefined): string {
    return (value ?? 'USD').trim().toUpperCase();
  }

  private assertNameRequired(name: string): void {
    if (name.trim().length === 0) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.NAME_REQUIRED,
        'Vendor name is required.',
      );
    }
  }

  private assertCurrencyValid(currency: string): void {
    if (!/^[A-Z]{3}$/i.test(currency.trim())) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.INVALID_CURRENCY,
        'Currency must be a 3-letter ISO code.',
      );
    }
  }

  private assertPaymentTermsValid(days: number): void {
    if (!Number.isInteger(days) || days < 0) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.INVALID_PAYMENT_TERMS,
        'Payment terms must be a non-negative integer.',
      );
    }
  }

  private assertVendorIsActive(vendor: VendorRecord): void {
    if (vendor.deletedAt !== null) {
      throw new VendorDomainError(
        VENDOR_DOMAIN_ERROR_CODES.VENDOR_ARCHIVED,
        'Vendor is archived and cannot be modified.',
      );
    }
  }
}
