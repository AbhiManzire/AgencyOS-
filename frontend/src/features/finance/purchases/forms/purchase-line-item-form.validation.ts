import { calculateLineItemTotal } from '@/features/sales/pricing/pricing-engine';
import type {
  CreatePurchaseBillLineItemPayload,
  UpdatePurchaseBillLineItemPayload,
} from '@/features/finance/purchases/api/purchase-line-item.types';
import type {
  PurchaseBillLineItemListItem,
  PurchaseLineItemFormErrors,
  PurchaseLineItemFormValues,
} from '@/features/finance/purchases/types';

export const DEFAULT_PURCHASE_LINE_ITEM_FORM_VALUES: PurchaseLineItemFormValues = {
  name: '',
  description: '',
  quantity: '1',
  unit: '',
  unitPrice: '',
  discount: '0',
  tax: '0',
};

export function purchaseLineItemToFormValues(
  item: PurchaseBillLineItemListItem,
): PurchaseLineItemFormValues {
  return {
    name: item.name,
    description: item.description ?? '',
    quantity: String(item.quantity),
    unit: item.unit ?? '',
    unitPrice: String(item.unitPrice),
    discount: String(item.discount),
    tax: String(item.tax),
  };
}

export function arePurchaseLineItemFormValuesEqual(
  left: PurchaseLineItemFormValues,
  right: PurchaseLineItemFormValues,
): boolean {
  return (
    left.name === right.name &&
    left.description === right.description &&
    left.quantity === right.quantity &&
    left.unit === right.unit &&
    left.unitPrice === right.unitPrice &&
    left.discount === right.discount &&
    left.tax === right.tax
  );
}

function parseNonNegativeAmount(value: string, fieldLabel: string): number | string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return `${fieldLabel} is required`;
  }

  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount < 0) {
    return `Enter a valid non-negative ${fieldLabel.toLowerCase()}`;
  }

  return amount;
}

export function validatePurchaseLineItemForm(
  values: PurchaseLineItemFormValues,
): PurchaseLineItemFormErrors {
  const errors: PurchaseLineItemFormErrors = {};

  const name = values.name.trim();
  if (name.length === 0) {
    errors.name = 'Name is required';
  } else if (name.length > 255) {
    errors.name = 'Name must be 255 characters or fewer';
  }

  const quantityText = values.quantity.trim();
  if (quantityText.length === 0) {
    errors.quantity = 'Quantity is required';
  } else {
    const quantity = Number(quantityText);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.quantity = 'Enter a quantity greater than zero';
    }
  }

  const unitPriceResult = parseNonNegativeAmount(values.unitPrice, 'Unit price');
  if (typeof unitPriceResult === 'string') {
    errors.unitPrice = unitPriceResult;
  }

  const discountResult = parseNonNegativeAmount(values.discount, 'Discount');
  if (typeof discountResult === 'string') {
    errors.discount = discountResult;
  }

  const taxResult = parseNonNegativeAmount(values.tax, 'Tax');
  if (typeof taxResult === 'string') {
    errors.tax = taxResult;
  }

  return errors;
}

export function calculatePurchaseLineItemFormTotal(values: PurchaseLineItemFormValues): number {
  const quantity = Number(values.quantity.trim()) || 0;
  const unitPrice = Number(values.unitPrice.trim()) || 0;
  const discount = Number(values.discount.trim()) || 0;
  const tax = Number(values.tax.trim()) || 0;

  return calculateLineItemTotal({ quantity, unitPrice, discount, tax });
}

export function toCreatePurchaseLineItemPayload(
  values: PurchaseLineItemFormValues,
): CreatePurchaseBillLineItemPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim().length > 0 ? values.description.trim() : null,
    quantity: Number(values.quantity.trim()),
    unit: values.unit.trim().length > 0 ? values.unit.trim() : null,
    unitPrice: Number(values.unitPrice.trim()),
    discount: Number(values.discount.trim()),
    tax: Number(values.tax.trim()),
  };
}

export function toUpdatePurchaseLineItemPayload(
  values: PurchaseLineItemFormValues,
): UpdatePurchaseBillLineItemPayload {
  return toCreatePurchaseLineItemPayload(values);
}
