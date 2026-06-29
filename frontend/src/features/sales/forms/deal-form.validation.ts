import type { CreateDealPayload } from '@/features/sales/api/deal.types';

export interface DealFormValues {
  clientId: string;
  contactId: string;
  title: string;
  value: string;
  expectedCloseDate: string;
}

export interface DealFormErrors {
  clientId?: string;
  title?: string;
  value?: string;
  form?: string;
}

export const DEFAULT_DEAL_FORM_VALUES: DealFormValues = {
  clientId: '',
  contactId: '',
  title: '',
  value: '',
  expectedCloseDate: '',
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

  return errors;
}

/** Returns true when form values differ from the loaded baseline. */
export function areDealFormValuesEqual(left: DealFormValues, right: DealFormValues): boolean {
  return (
    left.clientId === right.clientId &&
    left.contactId === right.contactId &&
    left.title === right.title &&
    left.value === right.value &&
    left.expectedCloseDate === right.expectedCloseDate
  );
}

/** Maps validated form values to create deal API payload. */
export function toCreateDealPayload(values: DealFormValues): CreateDealPayload {
  const contactId = values.contactId.trim();

  return {
    clientId: values.clientId,
    contactId: contactId.length > 0 ? contactId : null,
    title: values.title.trim(),
    value: Number(values.value.trim()),
    expectedCloseDate: values.expectedCloseDate.trim().length > 0 ? values.expectedCloseDate : null,
    stage: 'NEW',
  };
}
