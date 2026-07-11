import type {
  CreateLeadPayload,
  LeadRecord,
  UpdateLeadPayload,
} from '@/features/sales/leads/api/lead.types';
import type { CreateLeadStatus, LeadPriority, LeadSource } from '@/features/sales/leads/types';

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
  status: CreateLeadStatus;
  leadScore: string;
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
  email?: string;
  leadScore?: string;
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
  source: '',
  assignedToUserId: '',
  status: 'NEW',
  leadScore: '',
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

const EDITABLE_STATUSES: readonly CreateLeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED'];

function optionalTrim(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalScore(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return Number(trimmed);
}

/** Validates lead form values before submit. */
export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {};

  if (values.company.trim().length === 0) {
    errors.company = 'Company is required';
  } else if (values.company.trim().length > 255) {
    errors.company = 'Company must be 255 characters or fewer';
  }

  const email = values.email.trim();
  if (email.length > 0 && !email.includes('@')) {
    errors.email = 'Enter a valid email';
  }

  const scoreText = values.leadScore.trim();
  if (scoreText.length > 0) {
    const score = Number(scoreText);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      errors.leadScore = 'Score must be between 0 and 100';
    }
  }

  const sizeText = values.expectedDealSize.trim();
  if (sizeText.length > 0) {
    const size = Number(sizeText);
    if (!Number.isFinite(size) || size < 0) {
      errors.expectedDealSize = 'Enter a valid non-negative amount';
    }
  }

  return errors;
}

export function areLeadFormValuesEqual(left: LeadFormValues, right: LeadFormValues): boolean {
  return (
    left.company === right.company &&
    left.code === right.code &&
    left.contactPerson === right.contactPerson &&
    left.email === right.email &&
    left.phone === right.phone &&
    left.whatsapp === right.whatsapp &&
    left.website === right.website &&
    left.industry === right.industry &&
    left.country === right.country &&
    left.source === right.source &&
    left.assignedToUserId === right.assignedToUserId &&
    left.status === right.status &&
    left.leadScore === right.leadScore &&
    left.priority === right.priority &&
    left.expectedDealSize === right.expectedDealSize &&
    left.notes === right.notes &&
    left.need === right.need &&
    left.authority === right.authority &&
    left.budgetNotes === right.budgetNotes &&
    left.timeline === right.timeline &&
    left.painPoints === right.painPoints &&
    left.decisionMaker === right.decisionMaker &&
    left.competitor === right.competitor &&
    left.qualificationNotes === right.qualificationNotes
  );
}

export function leadRecordToFormValues(record: LeadRecord): LeadFormValues {
  const status: CreateLeadStatus = EDITABLE_STATUSES.includes(record.status as CreateLeadStatus)
    ? (record.status as CreateLeadStatus)
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
    leadScore: record.leadScore !== null ? String(record.leadScore) : '',
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
  const score = parseOptionalScore(values.leadScore);
  const sizeText = values.expectedDealSize.trim();

  return {
    company: values.company.trim(),
    code: optionalTrim(values.code),
    contactPerson: optionalTrim(values.contactPerson),
    email: optionalTrim(values.email),
    phone: optionalTrim(values.phone),
    whatsapp: optionalTrim(values.whatsapp),
    website: optionalTrim(values.website),
    industry: optionalTrim(values.industry),
    country: optionalTrim(values.country),
    source: values.source === '' ? undefined : values.source,
    assignedToUserId: optionalTrim(values.assignedToUserId),
    status: values.status,
    leadScore: score === undefined ? undefined : score,
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
  const score = parseOptionalScore(values.leadScore);
  const sizeText = values.expectedDealSize.trim();

  return {
    company: values.company.trim(),
    code: optionalTrimOrNull(values.code),
    contactPerson: optionalTrimOrNull(values.contactPerson),
    email: optionalTrimOrNull(values.email),
    phone: optionalTrimOrNull(values.phone),
    whatsapp: optionalTrimOrNull(values.whatsapp),
    website: optionalTrimOrNull(values.website),
    industry: optionalTrimOrNull(values.industry),
    country: optionalTrimOrNull(values.country),
    source: values.source === '' ? null : values.source,
    assignedToUserId: optionalTrimOrNull(values.assignedToUserId),
    status: values.status,
    leadScore: score === undefined ? null : score,
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
