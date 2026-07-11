import type { DealPriority } from '@/features/sales/types';
import type {
  CreateDealPayload,
  DealRecord,
  UpdateDealPayload,
} from '@/features/sales/api/deal.types';

export interface DealFormValues {
  clientId: string;
  contactId: string;
  leadId: string;
  title: string;
  value: string;
  expectedCloseDate: string;
  service: string;
  probability: string;
  priority: DealPriority;
}

export interface DealFormErrors {
  clientId?: string;
  title?: string;
  value?: string;
  probability?: string;
  form?: string;
}

export const DEFAULT_DEAL_FORM_VALUES: DealFormValues = {
  clientId: '',
  contactId: '',
  leadId: '',
  title: '',
  value: '',
  expectedCloseDate: '',
  service: '',
  probability: '',
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
    left.value === right.value &&
    left.expectedCloseDate === right.expectedCloseDate &&
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
    value: String(record.value),
    expectedCloseDate:
      record.expectedCloseDate !== null ? record.expectedCloseDate.slice(0, 10) : '',
    service: record.service ?? '',
    probability: record.probability !== null ? String(record.probability) : '',
    priority: record.priority,
  };
}

function optionalId(value: string): string | null {
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
    value: Number(values.value.trim()),
    expectedCloseDate: values.expectedCloseDate.trim().length > 0 ? values.expectedCloseDate : null,
    service: values.service.trim().length > 0 ? values.service.trim() : null,
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
    value: Number(values.value.trim()),
    expectedCloseDate: values.expectedCloseDate.trim().length > 0 ? values.expectedCloseDate : null,
    service: values.service.trim().length > 0 ? values.service.trim() : null,
    probability: probabilityText.length > 0 ? Number(probabilityText) : null,
    priority: values.priority,
    stage: 'NEW',
  };
}
