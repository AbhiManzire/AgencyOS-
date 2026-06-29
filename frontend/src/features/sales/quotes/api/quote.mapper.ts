import type { QuoteRecord } from '@/features/sales/quotes/api/quote.types';
import type { QuoteListItem } from '@/features/sales/quotes/types';

export function quoteRecordToListItem(record: QuoteRecord): QuoteListItem {
  return {
    id: record.id,
    dealId: record.dealId,
    dealTitle: record.dealTitle,
    clientId: record.clientId,
    clientName: record.clientName,
    quoteNumber: record.quoteNumber,
    title: record.title,
    status: record.status,
    validUntil: record.validUntil,
    currency: record.currency,
    totalAmount: record.totalAmount,
    updatedAt: record.updatedAt,
  };
}
