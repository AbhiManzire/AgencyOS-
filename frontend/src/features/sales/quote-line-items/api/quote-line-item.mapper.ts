import type { QuoteLineItemRecord } from '@/features/sales/quote-line-items/api/quote-line-item.types';
import type { QuoteLineItemListItem } from '@/features/sales/quote-line-items/types';

export function quoteLineItemRecordToListItem(record: QuoteLineItemRecord): QuoteLineItemListItem {
  return {
    id: record.id,
    quoteId: record.quoteId,
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
