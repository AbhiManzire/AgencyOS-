import { Card, CardContent, CardHeader } from '@/design-system';
import { Body, CardTitle, Caption } from '@/design-system/typography';
import type { InvoiceRecord } from '@/features/finance/invoices/api/invoice.types';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
  TAX_MODE_LABELS,
} from '@/features/finance/invoices/forms/invoice-form.validation';
import { APPROVAL_STATUS_LABELS } from '@/features/finance/shared/finance.types';

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
            <Caption className="block uppercase tracking-wide">Tax mode</Caption>
            <Body>{TAX_MODE_LABELS[invoice.taxMode]}</Body>
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
          <div>
            <Caption className="block uppercase tracking-wide">Deal</Caption>
            <Body className="font-mono text-xs">{invoice.dealId ?? '—'}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Approval</Caption>
            <Body>{APPROVAL_STATUS_LABELS[invoice.approvalStatus]}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Viewed at</Caption>
            <Body>{invoice.viewedAt ? formatInvoiceDate(invoice.viewedAt) : '—'}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Subtotal</Caption>
            <Body>{formatInvoiceAmount(invoice.subtotal, invoice.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Discount</Caption>
            <Body>{formatInvoiceAmount(invoice.discountAmount, invoice.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Tax</Caption>
            <Body>{formatInvoiceAmount(invoice.taxAmount, invoice.currency)}</Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Grand total</Caption>
            <Body className="font-medium">
              {formatInvoiceAmount(invoice.grandTotal, invoice.currency)}
            </Body>
          </div>
          <div>
            <Caption className="block uppercase tracking-wide">Balance due</Caption>
            <Body className="font-medium">
              {formatInvoiceAmount(invoice.balanceDue, invoice.currency)}
            </Body>
          </div>
        </div>

        {invoice.terms ? (
          <div>
            <Caption className="mb-2 block uppercase tracking-wide">Terms</Caption>
            <Body className="whitespace-pre-wrap text-muted-foreground">{invoice.terms}</Body>
          </div>
        ) : null}

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
