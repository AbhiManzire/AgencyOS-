import type { InvoiceRecord } from '@/features/finance/invoices/api/invoice.types';
import type { InvoiceListItem } from '@/features/finance/invoices/types';

export function invoiceRecordToListItem(record: InvoiceRecord): InvoiceListItem {
  return {
    id: record.id,
    clientId: record.clientId,
    clientName: record.clientName,
    projectId: record.projectId,
    projectName: record.projectName,
    quoteId: record.quoteId,
    quoteNumber: record.quoteNumber,
    invoiceNumber: record.invoiceNumber,
    status: record.status,
    issueDate: record.issueDate,
    dueDate: record.dueDate,
    currency: record.currency,
    updatedAt: record.updatedAt,
  };
}
