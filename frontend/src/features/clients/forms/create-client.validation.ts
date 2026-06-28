import type { CreateClientPayload, UpdateClientPayload } from '@/features/clients/api/client.types';
import type { ClientRecord } from '@/features/clients/api/client.types';
import type { ClientSource, ClientStatus } from '@/features/clients/types';

export interface CreateClientFormValues {
  displayName: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStatus;
  ownerUserId: string;
  source: ClientSource | '';
}

export type CreateClientFormField = keyof Omit<CreateClientFormValues, 'status' | 'source'>;

export interface CreateClientFormErrors {
  displayName?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  ownerUserId?: string;
  form?: string;
}

export const DEFAULT_CREATE_CLIENT_FORM_VALUES: CreateClientFormValues = {
  displayName: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  status: 'PROSPECT',
  ownerUserId: '',
  source: '',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validates create-client form values before submit. */
export function validateCreateClientForm(values: CreateClientFormValues): CreateClientFormErrors {
  const errors: CreateClientFormErrors = {};
  const displayName = values.displayName.trim();

  if (displayName.length === 0) {
    errors.displayName = 'Display name is required';
  } else if (displayName.length > 255) {
    errors.displayName = 'Display name must be 255 characters or fewer';
  }

  const company = values.company.trim();
  if (company.length > 255) {
    errors.company = 'Company must be 255 characters or fewer';
  }

  const email = values.email.trim();
  if (email.length > 0 && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  const phone = values.phone.trim();
  if (phone.length > 50) {
    errors.phone = 'Phone must be 50 characters or fewer';
  }

  const website = values.website.trim();
  if (website.length > 0 && !isValidWebsite(website)) {
    errors.website = 'Enter a valid URL including http:// or https://';
  }

  const ownerUserId = values.ownerUserId.trim();
  if (ownerUserId.length > 0 && !UUID_PATTERN.test(ownerUserId)) {
    errors.ownerUserId = 'Enter a valid owner user ID';
  }

  return errors;
}

/** Maps a client record to form values for edit mode. */
export function clientRecordToFormValues(record: ClientRecord): CreateClientFormValues {
  return {
    displayName: record.displayName,
    company: record.legalName ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    website: record.website ?? '',
    status: record.status,
    ownerUserId: record.ownerUserId ?? '',
    source: record.source ? (record.source as ClientSource) : '',
  };
}

/** Returns true when form values differ from the loaded baseline. */
export function areClientFormValuesEqual(
  left: CreateClientFormValues,
  right: CreateClientFormValues,
): boolean {
  return (
    left.displayName === right.displayName &&
    left.company === right.company &&
    left.email === right.email &&
    left.phone === right.phone &&
    left.website === right.website &&
    left.status === right.status &&
    left.ownerUserId === right.ownerUserId &&
    left.source === right.source
  );
}

/** Maps validated form values to the POST /clients request body. */
export function toCreateClientPayload(values: CreateClientFormValues): CreateClientPayload {
  const company = values.company.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const website = values.website.trim();
  const ownerUserId = values.ownerUserId.trim();

  return {
    displayName: values.displayName.trim(),
    status: values.status,
    ...(company.length > 0 ? { legalName: company } : {}),
    ...(email.length > 0 ? { email } : {}),
    ...(phone.length > 0 ? { phone } : {}),
    ...(website.length > 0 ? { website } : {}),
    ...(ownerUserId.length > 0 ? { ownerUserId } : {}),
    ...(values.source !== '' ? { source: values.source } : {}),
  };
}

/** Maps validated form values to the PATCH /clients/:id request body. */
export function toUpdateClientPayload(values: CreateClientFormValues): UpdateClientPayload {
  const company = values.company.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const website = values.website.trim();
  const ownerUserId = values.ownerUserId.trim();

  return {
    displayName: values.displayName.trim(),
    status: values.status,
    legalName: company.length > 0 ? company : null,
    email: email.length > 0 ? email : null,
    phone: phone.length > 0 ? phone : null,
    website: website.length > 0 ? website : null,
    ownerUserId: ownerUserId.length > 0 ? ownerUserId : null,
    source: values.source !== '' ? values.source : null,
  };
}

/** Maps API validation field names to form field keys. */
export function mapApiFieldToFormField(field: string): CreateClientFormField | 'form' | null {
  switch (field) {
    case 'displayName':
      return 'displayName';
    case 'legalName':
      return 'company';
    case 'email':
      return 'email';
    case 'phone':
      return 'phone';
    case 'website':
      return 'website';
    case 'ownerUserId':
      return 'ownerUserId';
    default:
      return null;
  }
}
