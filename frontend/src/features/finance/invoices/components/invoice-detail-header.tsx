'use client';

import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Body, Caption } from '@/design-system/typography';
import { Button } from '@/components/ui/button';
import type { InvoiceRecord } from '@/features/finance/invoices/api/invoice.types';
import { InvoiceDeliveryActions } from '@/features/finance/invoices/components/invoice-delivery-actions';
import { InvoiceStatusBadge } from '@/features/finance/invoices/components/invoice-status-badge';
import {
  formatInvoiceAmount,
  formatInvoiceDate,
  INVOICE_STATUS_LABELS,
} from '@/features/finance/invoices/forms/invoice-form.validation';
import { calculateQuotePricingSummary } from '@/features/sales/pricing/pricing-engine';
import type { InvoiceLineItemListItem } from '@/features/finance/invoice-line-items/types';
import { Can } from '@/lib/rbac';

interface InvoiceDetailHeaderProps {
  readonly invoice: InvoiceRecord;
  readonly lineItems?: readonly InvoiceLineItemListItem[];
  readonly amountPaid?: number;
  readonly outstandingAmount?: number;
  readonly onEdit: () => void;
}

export function InvoiceDetailHeader({
  invoice,
  lineItems = [],
  amountPaid,
  outstandingAmount,
  onEdit,
}: InvoiceDetailHeaderProps) {
  const summary = calculateQuotePricingSummary(lineItems);

  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <Button variant="ghost" size="sm" className="w-fit gap-2 px-0" asChild>
        <Link href="/finance/invoices">
          <ArrowLeft className="size-4" />
          Back to invoices
        </Link>
      </Button>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {invoice.invoiceNumber}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <p className="text-sm text-muted-foreground">{INVOICE_STATUS_LABELS[invoice.status]}</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <Caption className="block uppercase tracking-wide">Client</Caption>
              <Body className="font-medium">{invoice.clientName}</Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Project</Caption>
              <Body className="text-muted-foreground">{invoice.projectName}</Body>
            </div>
            <div>
              <Caption className="block uppercase tracking-wide">Due Date</Caption>
              <Body className="text-muted-foreground">{formatInvoiceDate(invoice.dueDate)}</Body>
            </div>
          </div>

          <InvoiceDeliveryActions
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            hasLineItems={lineItems.length > 0}
          />
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div>
            <Caption className="block uppercase tracking-wide">Total</Caption>
            <p className="mt-1 text-2xl font-semibold">
              {formatInvoiceAmount(summary.grandTotal, invoice.currency)}
            </p>
          </div>
          {amountPaid !== undefined ? (
            <div>
              <Caption className="block uppercase tracking-wide">Paid</Caption>
              <p className="mt-1 text-lg font-medium">
                {formatInvoiceAmount(amountPaid, invoice.currency)}
              </p>
            </div>
          ) : null}
          {outstandingAmount !== undefined ? (
            <div>
              <Caption className="block uppercase tracking-wide">Outstanding</Caption>
              <p className="mt-1 text-lg font-medium">
                {formatInvoiceAmount(outstandingAmount, invoice.currency)}
              </p>
            </div>
          ) : null}
          <Can permission="invoices.update" mode="disable">
            <Button type="button" variant="outline" className="mt-2 gap-2" onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
}
