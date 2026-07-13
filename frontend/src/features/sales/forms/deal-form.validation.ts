import type {
  CreateDealPayload,
  DealRecord,
  UpdateDealPayload,
} from '@/features/sales/api/deal.types';
import type { LeadSource } from '@/features/sales/leads/types';
import type { DealForecastCategory, DealPriority, DealStage } from '@/features/sales/types';

export interface DealFormValues {
  clientId: string;
  contactId: string;
  leadId: string;
  title: string;
  description: string;
  value: string;
  currency: string;
  expectedCloseDate: string;
  ownerUserId: string;
  stage: DealStage;
  source: LeadSource | '';
  forecastCategory: DealForecastCategory;
  service: string;
  probability: string;
  priority: DealPriority;
}

export interface DealFormErrors {
  clientId?: string;
  title?: string;
  value?: string;
  currency?: string;
  probability?: string;
  form?: string;
}

export const DEFAULT_DEAL_FORM_VALUES: DealFormValues = {
  clientId: '',
  contactId: '',
  leadId: '',
  title: '',
  description: '',
  value: '',
  currency: 'USD',
  expectedCloseDate: '',
  ownerUserId: '',
  stage: 'QUALIFICATION',
  source: '',
  forecastCategory: 'PIPELINE',
  service: '',
  probability: '10',
  priority: 'MEDIUM',
};

/** Validates deal form values before submit. */
export function validateDealForm(values: DealFormValues): DealFormErrors {
  const errors: DealFormErrors = {};

  if (values.clientId.trim().length === 0) {
    errors.clientId = 'Client is required';
  }

  const title = values.title.trim();
  if (title.length === 0) {
    errors.title = 'Deal title is required';
  } else if (title.length > 255) {
    errors.title = 'Title must be 255 characters or fewer';
  }

  const valueText = values.value.trim();
  if (valueText.length === 0) {
    errors.value = 'Value is required';
  } else {
    const value = Number(valueText);
    if (!Number.isFinite(value) || value < 0) {
      errors.value = 'Enter a valid non-negative amount';
    }
  }

  const currency = values.currency.trim().toUpperCase();
  if (currency.length > 0 && currency.length !== 3) {
    errors.currency = 'Currency must be a 3-letter code';
  }

  const probabilityText = values.probability.trim();
  if (probabilityText.length > 0) {
    const probability = Number(probabilityText);
    if (!Number.isFinite(probability) || probability < 0 || probability > 100) {
      errors.probability = 'Probability must be between 0 and 100';
    }
  }

  return errors;
}

/** Returns true when form values differ from the loaded baseline. */
export function areDealFormValuesEqual(left: DealFormValues, right: DealFormValues): boolean {
  return (
    left.clientId === right.clientId &&
    left.contactId === right.contactId &&
    left.leadId === right.leadId &&
    left.title === right.title &&
    left.description === right.description &&
    left.value === right.value &&
    left.currency === right.currency &&
    left.expectedCloseDate === right.expectedCloseDate &&
    left.ownerUserId === right.ownerUserId &&
    left.stage === right.stage &&
    left.source === right.source &&
    left.forecastCategory === right.forecastCategory &&
    left.service === right.service &&
    left.probability === right.probability &&
    left.priority === right.priority
  );
}

/** Maps a deal record to editable form values. */
export function dealRecordToFormValues(record: DealRecord): DealFormValues {
  return {
    clientId: record.clientId,
    contactId: record.contactId ?? '',
    leadId: record.leadId ?? '',
    title: record.title,
    description: record.description ?? '',
    value: String(record.value),
    currency: record.currency || 'USD',
    expectedCloseDate:
      record.expectedCloseDate !== null ? record.expectedCloseDate.slice(0, 10) : '',
    ownerUserId: record.ownerUserId ?? '',
    stage: record.stage,
    source: record.source ?? '',
    forecastCategory: record.forecastCategory,
    service: record.service ?? '',
    probability: record.probability !== null ? String(record.probability) : '',
    priority: record.priority,
  };
}

function optionalId(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Maps validated form values to update deal API payload. */
export function toUpdateDealPayload(values: DealFormValues): UpdateDealPayload {
  const probabilityText = values.probability.trim();

  return {
    clientId: values.clientId,
    contactId: optionalId(values.contactId),
    leadId: optionalId(values.leadId),
    title: values.title.trim(),
    description: optionalText(values.description),
    value: Number(values.value.trim()),
    currency: values.currency.trim().toUpperCase() || 'USD',
    expectedCloseDate: values.expectedCloseDate.trim().length > 0 ? values.expectedCloseDate : null,
    ownerUserId: optionalId(values.ownerUserId),
    stage: values.stage,
    source: values.source === '' ? null : values.source,
    forecastCategory: values.forecastCategory,
    service: optionalText(values.service),
    probability: probabilityText.length > 0 ? Number(probabilityText) : null,
    priority: values.priority,
  };
}

/** Maps validated form values to create deal API payload. */
export function toCreateDealPayload(values: DealFormValues): CreateDealPayload {
  const probabilityText = values.probability.trim();

  return {
    clientId: values.clientId,
    contactId: optionalId(values.contactId),
    leadId: optionalId(values.leadId),
    title: values.title.trim(),
    description: optionalText(values.description),
    value: Number(values.value.trim()),
    currency: values.currency.trim().toUpperCase() || 'USD',
    expectedCloseDate: values.expectedCloseDate.trim().length > 0 ? values.expectedCloseDate : null,
    ownerUserId: optionalId(values.ownerUserId),
    stage: values.stage,
    source: values.source === '' ? null : values.source,
    forecastCategory: values.forecastCategory,
    service: optionalText(values.service),
    probability: probabilityText.length > 0 ? Number(probabilityText) : null,
    priority: values.priority,
  };
}
