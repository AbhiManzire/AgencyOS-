import type {
  CreateLeadPayload,
  LeadRecord,
  UpdateLeadPayload,
} from '@/features/sales/leads/api/lead.types';
import type {
  CreateLeadStatus,
  EditableLeadStatus,
  LeadPriority,
  LeadSource,
} from '@/features/sales/leads/types';

export interface LeadFormValues {
  company: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  industry: string;
  country: string;
  source: LeadSource | '';
  assignedToUserId: string;
  status: EditableLeadStatus;
  priority: LeadPriority;
  expectedDealSize: string;
  notes: string;
  need: string;
  authority: string;
  budgetNotes: string;
  timeline: string;
  painPoints: string;
  decisionMaker: string;
  competitor: string;
  qualificationNotes: string;
}

export interface LeadFormErrors {
  company?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  source?: string;
  expectedDealSize?: string;
  form?: string;
}

export const DEFAULT_LEAD_FORM_VALUES: LeadFormValues = {
  company: '',
  code: '',
  contactPerson: '',
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  industry: '',
  country: '',
  source: 'MANUAL',
  assignedToUserId: '',
  status: 'NEW',
  priority: 'MEDIUM',
  expectedDealSize: '',
  notes: '',
  need: '',
  authority: '',
  budgetNotes: '',
  timeline: '',
  painPoints: '',
  decisionMaker: '',
  competitor: '',
  qualificationNotes: '',
};

const EDITABLE_STATUSES: readonly EditableLeadStatus[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
];
const CREATABLE_STATUSES: readonly CreateLeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{7,15}$/;

function optionalTrim(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidWebsite(value: string): boolean {
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    return url.hostname.length > 0 && url.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Auto lead score (0–100) — mirrors backend LeadDomainService.calculateLeadScore.
 */
export function calculateLeadScore(values: LeadFormValues): number {
  let score = 0;

  if (values.decisionMaker.trim().length > 0) {
    score += 20;
  }
  if (values.budgetNotes.trim().length > 0) {
    score += 20;
  }
  if (values.timeline.trim().length > 0) {
    score += 20;
  }
  if (values.website.trim().length > 0 && isValidWebsite(values.website)) {
    score += 10;
  }
  if (values.email.trim().length > 0 && EMAIL_PATTERN.test(values.email.trim())) {
    score += 10;
  }
  if (values.phone.trim().length > 0 && PHONE_PATTERN.test(values.phone.trim())) {
    score += 10;
  }
  if (values.company.trim().length > 0) {
    score += 10;
  }

  return score;
}

/** Validates lead form values (inline and on submit). */
export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (values.company.trim().length === 0) {
    errors.company = 'Company is required';
  } else if (values.company.trim().length > 255) {
    errors.company = 'Company must be 255 characters or fewer';
  }

  if (values.contactPerson.trim().length === 0) {
    errors.contactPerson = 'Contact person is required';
  } else if (values.contactPerson.trim().length > 255) {
    errors.contactPerson = 'Contact person must be 255 characters or fewer';
  }

  const email = values.email.trim();
  if (email.length === 0) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email';
  }

  const phone = values.phone.trim();
  if (phone.length === 0) {
    errors.phone = 'Phone is required';
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone must be 7–15 digits only';
  }

  if (values.source === '') {
    errors.source = 'Source is required';
  }

  const website = values.website.trim();
  if (website.length > 0 && !isValidWebsite(website)) {
    errors.website = 'Enter a valid website URL';
  }

  const sizeText = values.expectedDealSize.trim();
  if (sizeText.length > 0) {
    const size = Number(sizeText);
    if (!Number.isFinite(size) || size <= 0) {
      errors.expectedDealSize = 'Enter a positive deal size';
    }
  }

  return errors;
}

export function isLeadFormValid(values: LeadFormValues): boolean {
  return Object.keys(validateLeadForm(values)).length === 0;
}

export function areLeadFormValuesEqual(left: LeadFormValues, right: LeadFormValues): boolean {
  const keys = Object.keys(DEFAULT_LEAD_FORM_VALUES) as (keyof LeadFormValues)[];
  return keys.every((key) => left[key] === right[key]);
}

export function leadRecordToFormValues(record: LeadRecord): LeadFormValues {
  const status: EditableLeadStatus = EDITABLE_STATUSES.includes(record.status as EditableLeadStatus)
    ? (record.status as EditableLeadStatus)
    : 'NEW';

  return {
    company: record.company,
    code: record.code ?? '',
    contactPerson: record.contactPerson ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    whatsapp: record.whatsapp ?? '',
    website: record.website ?? '',
    industry: record.industry ?? '',
    country: record.country ?? '',
    source: record.source ?? '',
    assignedToUserId: record.assignedToUserId ?? '',
    status,
    priority: record.priority,
    expectedDealSize: record.expectedDealSize !== null ? String(record.expectedDealSize) : '',
    notes: record.notes ?? '',
    need: record.need ?? '',
    authority: record.authority ?? '',
    budgetNotes: record.budgetNotes ?? '',
    timeline: record.timeline ?? '',
    painPoints: record.painPoints ?? '',
    decisionMaker: record.decisionMaker ?? '',
    competitor: record.competitor ?? '',
    qualificationNotes: record.qualificationNotes ?? '',
  };
}

export function toCreateLeadPayload(values: LeadFormValues): CreateLeadPayload {
  const sizeText = values.expectedDealSize.trim();
  const status: CreateLeadStatus = CREATABLE_STATUSES.includes(values.status as CreateLeadStatus)
    ? (values.status as CreateLeadStatus)
    : 'NEW';

  return {
    company: values.company.trim(),
    code: optionalTrim(values.code),
    contactPerson: values.contactPerson.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    whatsapp: optionalTrim(values.whatsapp),
    website: optionalTrim(values.website),
    industry: optionalTrim(values.industry),
    country: optionalTrim(values.country),
    source: values.source === '' ? undefined : values.source,
    assignedToUserId: optionalTrim(values.assignedToUserId),
    status,
    priority: values.priority,
    expectedDealSize: sizeText.length > 0 ? Number(sizeText) : null,
    notes: optionalTrim(values.notes),
    need: optionalTrim(values.need),
    authority: optionalTrim(values.authority),
    budgetNotes: optionalTrim(values.budgetNotes),
    timeline: optionalTrim(values.timeline),
    painPoints: optionalTrim(values.painPoints),
    decisionMaker: optionalTrim(values.decisionMaker),
    competitor: optionalTrim(values.competitor),
    qualificationNotes: optionalTrim(values.qualificationNotes),
  };
}

export function toUpdateLeadPayload(values: LeadFormValues): UpdateLeadPayload {
  const sizeText = values.expectedDealSize.trim();

  return {
    company: values.company.trim(),
    code: optionalTrimOrNull(values.code),
    contactPerson: values.contactPerson.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    whatsapp: optionalTrimOrNull(values.whatsapp),
    website: optionalTrimOrNull(values.website),
    industry: optionalTrimOrNull(values.industry),
    country: optionalTrimOrNull(values.country),
    source: values.source === '' ? undefined : values.source,
    assignedToUserId: optionalTrimOrNull(values.assignedToUserId),
    status: values.status,
    priority: values.priority,
    expectedDealSize: sizeText.length > 0 ? Number(sizeText) : null,
    notes: optionalTrimOrNull(values.notes),
    need: optionalTrimOrNull(values.need),
    authority: optionalTrimOrNull(values.authority),
    budgetNotes: optionalTrimOrNull(values.budgetNotes),
    timeline: optionalTrimOrNull(values.timeline),
    painPoints: optionalTrimOrNull(values.painPoints),
    decisionMaker: optionalTrimOrNull(values.decisionMaker),
    competitor: optionalTrimOrNull(values.competitor),
    qualificationNotes: optionalTrimOrNull(values.qualificationNotes),
  };
}
