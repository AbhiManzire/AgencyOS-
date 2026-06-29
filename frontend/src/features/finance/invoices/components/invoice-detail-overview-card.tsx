import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, CardTitle, Caption } from '@/design-system/typography';
import type { InvoiceRecord } from '@/features/finance/invoices/api/invoice.types';
import {
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
} from '@/features/finance/invoices/forms/invoice-form.validation';

interface InvoiceDetailOverviewCardProps {
  readonly invoice: InvoiceRecord;
}

export function InvoiceDetailOverviewCard({ invoice }: InvoiceDetailOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Caption className="block uppercase tracking-wide">Invoice Number</Caption>
            <Body className="font-medium">{invoice.invoiceNumber}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Status</Caption>
            <Body>{INVOICE_STATUS_LABELS[invoice.status]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Currency</Caption>
            <Body>{invoice.currency}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Issue Date</Caption>
            <Body>{formatInvoiceDate(invoice.issueDate)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Due Date</Caption>
            <Body>{formatInvoiceDate(invoice.dueDate)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Quote</Caption>
            <Body>{invoice.quoteNumber ?? '—'}</Body>
          </div>
        </div>

        {invoice.notes ? (
          <div>
            <Caption className="mb-2 block uppercase tracking-wide">Notes</Caption>
            <Body className="whitespace-pre-wrap text-muted-foreground">{invoice.notes}</Body>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
