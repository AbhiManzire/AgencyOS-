import type {
  CreateVendorPayload,
  UpdateVendorPayload,
  VendorRecord,
} from '@/features/finance/vendors/api/vendor.types';
import { formatShortDate } from '@/lib/format/date';

export interface VendorFormValues {
  name: string;
  code: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  contactPerson: string;
  paymentTermsDays: string;
  currency: string;
  notes: string;
}

export interface VendorFormErrors {
  name?: string;
  email?: string;
  paymentTermsDays?: string;
  currency?: string;
  form?: string;
}

export const DEFAULT_VENDOR_FORM_VALUES: VendorFormValues = {
  name: '',
  code: '',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  contactPerson: '',
  paymentTermsDays: '',
  currency: 'USD',
  notes: '',
};

function optionalTrim(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Validates vendor form values before submit. */
export function validateVendorForm(values: VendorFormValues): VendorFormErrors {
  const errors: VendorFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (values.name.trim().length > 255) {
    errors.name = 'Name must be 255 characters or fewer';
  }

  const email = values.email.trim();
  if (email.length > 0 && !email.includes('@')) {
    errors.email = 'Enter a valid email';
  }

  const termsText = values.paymentTermsDays.trim();
  if (termsText.length > 0) {
    const terms = Number(termsText);
    if (!Number.isInteger(terms) || terms < 0) {
      errors.paymentTermsDays = 'Enter a whole number of days (0 or more)';
    }
  }

  if (!/^[A-Za-z]{3}$/.test(values.currency.trim())) {
    errors.currency = 'Currency must be a 3-letter ISO code';
  }

  return errors;
}

export function areVendorFormValuesEqual(left: VendorFormValues, right: VendorFormValues): boolean {
  return (
    left.name === right.name &&
    left.code === right.code &&
    left.gstin === right.gstin &&
    left.pan === right.pan &&
    left.email === right.email &&
    left.phone === right.phone &&
    left.contactPerson === right.contactPerson &&
    left.paymentTermsDays === right.paymentTermsDays &&
    left.currency === right.currency &&
    left.notes === right.notes
  );
}

export function vendorRecordToFormValues(record: VendorRecord): VendorFormValues {
  return {
    name: record.name,
    code: record.code ?? '',
    gstin: record.gstin ?? '',
    pan: record.pan ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    contactPerson: record.contactPerson ?? '',
    paymentTermsDays: record.paymentTermsDays !== null ? String(record.paymentTermsDays) : '',
    currency: record.currency,
    notes: record.notes ?? '',
  };
}

export function toCreateVendorPayload(values: VendorFormValues): CreateVendorPayload {
  const termsText = values.paymentTermsDays.trim();

  return {
    name: values.name.trim(),
    code: optionalTrim(values.code),
    gstin: optionalTrim(values.gstin),
    pan: optionalTrim(values.pan),
    email: optionalTrim(values.email),
    phone: optionalTrim(values.phone),
    contactPerson: optionalTrim(values.contactPerson),
    paymentTermsDays: termsText.length > 0 ? Number(termsText) : null,
    currency: values.currency.trim().toUpperCase(),
    notes: optionalTrim(values.notes),
  };
}

export function toUpdateVendorPayload(values: VendorFormValues): UpdateVendorPayload {
  const termsText = values.paymentTermsDays.trim();

  return {
    name: values.name.trim(),
    code: optionalTrimOrNull(values.code),
    gstin: optionalTrimOrNull(values.gstin),
    pan: optionalTrimOrNull(values.pan),
    email: optionalTrimOrNull(values.email),
    phone: optionalTrimOrNull(values.phone),
    contactPerson: optionalTrimOrNull(values.contactPerson),
    paymentTermsDays: termsText.length > 0 ? Number(termsText) : null,
    currency: values.currency.trim().toUpperCase(),
    notes: optionalTrimOrNull(values.notes),
  };
}

export function formatVendorDate(value: string | null | undefined): string {
  return formatShortDate(value);
}

export function isVendorArchived(vendor: Pick<VendorRecord, 'deletedAt'>): boolean {
  return vendor.deletedAt !== null;
}
