import type {
  CreateClientPayload,
  CreateClientStatus,
  UpdateClientPayload,
} from '@/features/clients/api/client.types';
import type { ClientRecord } from '@/features/clients/api/client.types';
import type { ClientSource, ClientStatus } from '@/features/clients/types';

export interface CreateClientFormValues {
  displayName: string;
  company: string;
  clientCode: string;
  industry: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStatus;
  ownerUserId: string;
  source: ClientSource | '';
  currency: string;
  gstin: string;
  pan: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  countryCode: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingStateRegion: string;
  shippingPostalCode: string;
  shippingCountryCode: string;
}

export type CreateClientFormField = keyof Omit<CreateClientFormValues, 'status' | 'source'>;

export interface CreateClientFormErrors {
  displayName?: string;
  company?: string;
  clientCode?: string;
  industry?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  ownerUserId?: string;
  currency?: string;
  gstin?: string;
  pan?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateRegion?: string;
  postalCode?: string;
  countryCode?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingStateRegion?: string;
  shippingPostalCode?: string;
  shippingCountryCode?: string;
  form?: string;
}

export const DEFAULT_CREATE_CLIENT_FORM_VALUES: CreateClientFormValues = {
  displayName: '',
  company: '',
  clientCode: '',
  industry: '',
  email: '',
  phone: '',
  website: '',
  status: 'PROSPECT',
  ownerUserId: '',
  source: '',
  currency: '',
  gstin: '',
  pan: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateRegion: '',
  postalCode: '',
  countryCode: '',
  shippingAddressLine1: '',
  shippingAddressLine2: '',
  shippingCity: '',
  shippingStateRegion: '',
  shippingPostalCode: '',
  shippingCountryCode: '',
};

const CREATABLE_STATUSES: readonly CreateClientStatus[] = ['PROSPECT'];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Indian GSTIN: 2-digit state + PAN + entity + Z + check digit. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const CURRENCY_PATTERN = /^[A-Z]{3}$/i;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/i;
const PHONE_PATTERN = /^\d{7,15}$/;

function isValidWebsite(value: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    return url.hostname.length > 0 && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function optionalMaxLength(
  errors: CreateClientFormErrors,
  field: CreateClientFormField,
  value: string,
  max: number,
  label: string,
): void {
  if (value.length > max) {
    errors[field] = `${label} must be ${String(max)} characters or fewer`;
  }
}

/** Validates create/edit client form values (inline and on submit). */
export function validateCreateClientForm(
  values: CreateClientFormValues,
  options?: { readonly mode?: 'create' | 'edit' },
): CreateClientFormErrors {
  const mode = options?.mode ?? 'create';
  const errors: CreateClientFormErrors = {};

  const company = values.company.trim();
  if (company.length === 0) {
    errors.company = 'Company is required';
  } else if (company.length < 2) {
    errors.company = 'Company must be at least 2 characters';
  } else if (company.length > 255) {
    errors.company = 'Company must be 255 characters or fewer';
  }

  // Keep displayName aligned with Company for API identity.
  const displayName = values.displayName.trim() || company;
  if (displayName.length > 255) {
    errors.company = errors.company ?? 'Company must be 255 characters or fewer';
  }

  optionalMaxLength(errors, 'industry', values.industry.trim(), 120, 'Industry');

  const email = values.email.trim();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  const phone = values.phone.trim();
  if (phone.length > 0 && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone must be 7–15 digits only';
  }

  const website = values.website.trim();
  if (website.length > 0 && !isValidWebsite(website)) {
    errors.website = 'Enter a valid website URL';
  }

  if (mode === 'create' && !CREATABLE_STATUSES.includes(values.status as CreateClientStatus)) {
    errors.status = 'New clients must be created as Prospect. Active status comes from a won deal.';
  }

  const ownerUserId = values.ownerUserId.trim();
  if (ownerUserId.length > 0 && !UUID_PATTERN.test(ownerUserId)) {
    errors.ownerUserId = 'Select a valid owner';
  }

  const currency = values.currency.trim();
  if (currency.length > 0 && !CURRENCY_PATTERN.test(currency)) {
    errors.currency = 'Currency must be a 3-letter ISO code';
  }

  const gstin = values.gstin.trim();
  if (gstin.length > 0 && !GSTIN_PATTERN.test(gstin)) {
    errors.gstin = 'Enter a valid Indian GSTIN';
  }

  const pan = values.pan.trim();
  if (pan.length > 0 && !PAN_PATTERN.test(pan)) {
    errors.pan = 'Enter a valid PAN';
  }

  optionalMaxLength(errors, 'addressLine1', values.addressLine1.trim(), 255, 'Address line 1');
  optionalMaxLength(errors, 'addressLine2', values.addressLine2.trim(), 255, 'Address line 2');
  optionalMaxLength(errors, 'city', values.city.trim(), 120, 'City');
  optionalMaxLength(errors, 'stateRegion', values.stateRegion.trim(), 120, 'State / region');
  optionalMaxLength(errors, 'postalCode', values.postalCode.trim(), 20, 'Postal code');

  const countryCode = values.countryCode.trim();
  if (countryCode.length > 0 && !COUNTRY_CODE_PATTERN.test(countryCode)) {
    errors.countryCode = 'Country code must be a 2-letter ISO code';
  }

  optionalMaxLength(
    errors,
    'shippingAddressLine1',
    values.shippingAddressLine1.trim(),
    255,
    'Shipping address line 1',
  );
  optionalMaxLength(
    errors,
    'shippingAddressLine2',
    values.shippingAddressLine2.trim(),
    255,
    'Shipping address line 2',
  );
  optionalMaxLength(errors, 'shippingCity', values.shippingCity.trim(), 120, 'Shipping city');
  optionalMaxLength(
    errors,
    'shippingStateRegion',
    values.shippingStateRegion.trim(),
    120,
    'Shipping state / region',
  );
  optionalMaxLength(
    errors,
    'shippingPostalCode',
    values.shippingPostalCode.trim(),
    20,
    'Shipping postal code',
  );

  const shippingCountryCode = values.shippingCountryCode.trim();
  if (shippingCountryCode.length > 0 && !COUNTRY_CODE_PATTERN.test(shippingCountryCode)) {
    errors.shippingCountryCode = 'Shipping country code must be a 2-letter ISO code';
  }

  return errors;
}

/** True when the form has no field-level validation errors. */
export function isCreateClientFormValid(
  values: CreateClientFormValues,
  options?: { readonly mode?: 'create' | 'edit' },
): boolean {
  return Object.keys(validateCreateClientForm(values, options)).length === 0;
}

/** Maps a client record to form values for edit mode. */
export function clientRecordToFormValues(record: ClientRecord): CreateClientFormValues {
  return {
    displayName: record.displayName,
    company: record.displayName,
    clientCode: record.clientCode ?? '',
    industry: record.industry ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    website: record.website ?? '',
    status: record.status === 'ARCHIVED' ? 'INACTIVE' : record.status,
    ownerUserId: record.ownerUserId ?? '',
    source: record.source ? (record.source as ClientSource) : '',
    currency: record.currency ?? '',
    gstin: record.gstin ?? '',
    pan: record.pan ?? '',
    addressLine1: record.addressLine1 ?? '',
    addressLine2: record.addressLine2 ?? '',
    city: record.city ?? '',
    stateRegion: record.stateRegion ?? '',
    postalCode: record.postalCode ?? '',
    countryCode: record.countryCode ?? '',
    shippingAddressLine1: record.shippingAddressLine1 ?? '',
    shippingAddressLine2: record.shippingAddressLine2 ?? '',
    shippingCity: record.shippingCity ?? '',
    shippingStateRegion: record.shippingStateRegion ?? '',
    shippingPostalCode: record.shippingPostalCode ?? '',
    shippingCountryCode: record.shippingCountryCode ?? '',
  };
}

/** Returns true when form values differ from the loaded baseline. */
export function areClientFormValuesEqual(
  left: CreateClientFormValues,
  right: CreateClientFormValues,
): boolean {
  const keys = Object.keys(DEFAULT_CREATE_CLIENT_FORM_VALUES) as (keyof CreateClientFormValues)[];
  return keys.every((key) => left[key] === right[key]);
}

function optionalCreateString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalUpdateString(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveDisplayName(values: CreateClientFormValues): string {
  const company = values.company.trim();
  const displayName = values.displayName.trim();
  return displayName.length > 0 ? displayName : company;
}

/** Maps validated form values to the POST /clients request body. */
export function toCreateClientPayload(values: CreateClientFormValues): CreateClientPayload {
  const displayName = resolveDisplayName(values);
  const legalName = optionalCreateString(values.company);

  return {
    displayName,
    status: 'PROSPECT',
    ...(legalName !== undefined ? { legalName } : {}),
    ...(optionalCreateString(values.industry) !== undefined
      ? { industry: optionalCreateString(values.industry) }
      : {}),
    ...(optionalCreateString(values.email) !== undefined
      ? { email: optionalCreateString(values.email) }
      : {}),
    ...(optionalCreateString(values.phone) !== undefined
      ? { phone: optionalCreateString(values.phone) }
      : {}),
    ...(optionalCreateString(values.website) !== undefined
      ? { website: optionalCreateString(values.website) }
      : {}),
    ...(optionalCreateString(values.ownerUserId) !== undefined
      ? { ownerUserId: optionalCreateString(values.ownerUserId) }
      : {}),
    ...(values.source !== '' ? { source: values.source } : {}),
    ...(optionalCreateString(values.currency) !== undefined
      ? { currency: optionalCreateString(values.currency)?.toUpperCase() }
      : {}),
    ...(optionalCreateString(values.gstin) !== undefined
      ? { gstin: optionalCreateString(values.gstin)?.toUpperCase() }
      : {}),
    ...(optionalCreateString(values.pan) !== undefined
      ? { pan: optionalCreateString(values.pan)?.toUpperCase() }
      : {}),
    ...(optionalCreateString(values.addressLine1) !== undefined
      ? { addressLine1: optionalCreateString(values.addressLine1) }
      : {}),
    ...(optionalCreateString(values.addressLine2) !== undefined
      ? { addressLine2: optionalCreateString(values.addressLine2) }
      : {}),
    ...(optionalCreateString(values.city) !== undefined
      ? { city: optionalCreateString(values.city) }
      : {}),
    ...(optionalCreateString(values.stateRegion) !== undefined
      ? { stateRegion: optionalCreateString(values.stateRegion) }
      : {}),
    ...(optionalCreateString(values.postalCode) !== undefined
      ? { postalCode: optionalCreateString(values.postalCode) }
      : {}),
    ...(optionalCreateString(values.countryCode) !== undefined
      ? { countryCode: optionalCreateString(values.countryCode)?.toUpperCase() }
      : {}),
    ...(optionalCreateString(values.shippingAddressLine1) !== undefined
      ? { shippingAddressLine1: optionalCreateString(values.shippingAddressLine1) }
      : {}),
    ...(optionalCreateString(values.shippingAddressLine2) !== undefined
      ? { shippingAddressLine2: optionalCreateString(values.shippingAddressLine2) }
      : {}),
    ...(optionalCreateString(values.shippingCity) !== undefined
      ? { shippingCity: optionalCreateString(values.shippingCity) }
      : {}),
    ...(optionalCreateString(values.shippingStateRegion) !== undefined
      ? { shippingStateRegion: optionalCreateString(values.shippingStateRegion) }
      : {}),
    ...(optionalCreateString(values.shippingPostalCode) !== undefined
      ? { shippingPostalCode: optionalCreateString(values.shippingPostalCode) }
      : {}),
    ...(optionalCreateString(values.shippingCountryCode) !== undefined
      ? { shippingCountryCode: optionalCreateString(values.shippingCountryCode)?.toUpperCase() }
      : {}),
  };
}

/** Maps validated form values to the PATCH /clients/:id request body. */
export function toUpdateClientPayload(values: CreateClientFormValues): UpdateClientPayload {
  return {
    displayName: resolveDisplayName(values),
    status: values.status === 'ARCHIVED' ? 'INACTIVE' : values.status,
    legalName: optionalUpdateString(values.company),
    industry: optionalUpdateString(values.industry),
    email: optionalUpdateString(values.email),
    phone: optionalUpdateString(values.phone),
    website: optionalUpdateString(values.website),
    ownerUserId: optionalUpdateString(values.ownerUserId),
    source: values.source !== '' ? values.source : null,
    currency: optionalUpdateString(values.currency)?.toUpperCase() ?? null,
    gstin: optionalUpdateString(values.gstin)?.toUpperCase() ?? null,
    pan: optionalUpdateString(values.pan)?.toUpperCase() ?? null,
    addressLine1: optionalUpdateString(values.addressLine1),
    addressLine2: optionalUpdateString(values.addressLine2),
    city: optionalUpdateString(values.city),
    stateRegion: optionalUpdateString(values.stateRegion),
    postalCode: optionalUpdateString(values.postalCode),
    countryCode: optionalUpdateString(values.countryCode)?.toUpperCase() ?? null,
    shippingAddressLine1: optionalUpdateString(values.shippingAddressLine1),
    shippingAddressLine2: optionalUpdateString(values.shippingAddressLine2),
    shippingCity: optionalUpdateString(values.shippingCity),
    shippingStateRegion: optionalUpdateString(values.shippingStateRegion),
    shippingPostalCode: optionalUpdateString(values.shippingPostalCode),
    shippingCountryCode: optionalUpdateString(values.shippingCountryCode)?.toUpperCase() ?? null,
  };
}

/** Maps API validation field names to form field keys. */
export function mapApiFieldToFormField(field: string): CreateClientFormField | 'form' | null {
  switch (field) {
    case 'displayName':
      return 'displayName';
    case 'legalName':
      return 'company';
    case 'clientCode':
      return 'clientCode';
    case 'industry':
      return 'industry';
    case 'email':
      return 'email';
    case 'phone':
      return 'phone';
    case 'website':
      return 'website';
    case 'ownerUserId':
      return 'ownerUserId';
    case 'currency':
      return 'currency';
    case 'gstin':
      return 'gstin';
    case 'pan':
      return 'pan';
    case 'addressLine1':
      return 'addressLine1';
    case 'addressLine2':
      return 'addressLine2';
    case 'city':
      return 'city';
    case 'stateRegion':
      return 'stateRegion';
    case 'postalCode':
      return 'postalCode';
    case 'countryCode':
      return 'countryCode';
    case 'shippingAddressLine1':
      return 'shippingAddressLine1';
    case 'shippingAddressLine2':
      return 'shippingAddressLine2';
    case 'shippingCity':
      return 'shippingCity';
    case 'shippingStateRegion':
      return 'shippingStateRegion';
    case 'shippingPostalCode':
      return 'shippingPostalCode';
    case 'shippingCountryCode':
      return 'shippingCountryCode';
    default:
      return null;
  }
}
