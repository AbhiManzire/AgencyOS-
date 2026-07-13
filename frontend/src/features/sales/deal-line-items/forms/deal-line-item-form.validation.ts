export interface DealLineItemFormValues {
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  tax: string;
}

export interface DealLineItemFormErrors {
  name?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  tax?: string;
  form?: string;
}

export const DEFAULT_DEAL_LINE_ITEM_FORM_VALUES: DealLineItemFormValues = {
  name: '',
  description: '',
  quantity: '1',
  unitPrice: '',
  discount: '0',
  tax: '0',
};

export function validateDealLineItemForm(values: DealLineItemFormValues): DealLineItemFormErrors {
  const errors: DealLineItemFormErrors = {};

  if (values.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  const quantity = Number(values.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }

  const unitPrice = Number(values.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    errors.unitPrice = 'Enter a valid unit price';
  }

  const discount = Number(values.discount || '0');
  if (!Number.isFinite(discount) || discount < 0) {
    errors.discount = 'Discount must be 0 or greater';
  }

  const tax = Number(values.tax || '0');
  if (!Number.isFinite(tax) || tax < 0) {
    errors.tax = 'Tax must be 0 or greater';
  }

  return errors;
}

export function toCreateDealLineItemPayload(values: DealLineItemFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    quantity: Number(values.quantity),
    unitPrice: Number(values.unitPrice),
    discount: Number(values.discount || '0'),
    tax: Number(values.tax || '0'),
  };
}

export function toUpdateDealLineItemPayload(values: DealLineItemFormValues) {
  return toCreateDealLineItemPayload(values);
}
