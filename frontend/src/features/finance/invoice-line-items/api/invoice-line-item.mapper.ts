import type { InvoiceLineItemRecord } from '@/features/finance/invoice-line-items/api/invoice-line-item.types';
import type { InvoiceLineItemListItem } from '@/features/finance/invoice-line-items/types';

export function invoiceLineItemRecordToListItem(
  record: InvoiceLineItemRecord,
): InvoiceLineItemListItem {
  return {
    id: record.id,
    invoiceId: record.invoiceId,
    name: record.name,
    description: record.description,
    quantity: record.quantity,
    unit: record.unit,
    unitPrice: record.unitPrice,
    discount: record.discount,
    tax: record.tax,
    total: record.total,
    sortOrder: record.sortOrder,
  };
}
