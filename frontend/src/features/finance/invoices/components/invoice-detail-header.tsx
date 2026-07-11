'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Eye, Pencil, XCircle } from 'lucide-react';
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
import {
  useApproveInvoice,
  useCancelInvoice,
  useMarkInvoiceViewed,
} from '@/features/finance/invoices/hooks/use-invoice-actions';
import type { InvoiceLineItemListItem } from '@/features/finance/invoice-line-items/types';
import { useToast } from '@/design-system';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
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
  const { showToast } = useToast();
  const { mutateAsync: markViewed, isPending: isMarkingViewed } = useMarkInvoiceViewed();
  const { mutateAsync: cancel, isPending: isCancelling } = useCancelInvoice();
  const { mutateAsync: approve, isPending: isApproving } = useApproveInvoice();

  const canCancel =
    invoice.status !== 'CANCELLED' && invoice.status !== 'VOID' && invoice.status !== 'PAID';
  const canApprove = invoice.approvalStatus === 'PENDING';
  const canMarkViewed = invoice.status === 'SENT' || invoice.viewedAt === null;

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
  ): Promise<void> => {
    try {
      await action();
      showToast(successMessage, 'success');
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    }
  };

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

          <Can permission="invoices.update">
            <div className="flex flex-wrap gap-2">
              {canMarkViewed ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isMarkingViewed}
                  onClick={() => {
                    void runAction(() => markViewed(invoice.id), 'Invoice marked as viewed');
                  }}
                >
                  <Eye className="size-4" />
                  Mark viewed
                </Button>
              ) : null}
              {canApprove ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isApproving}
                  onClick={() => {
                    void runAction(() => approve(invoice.id), 'Invoice approved');
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isCancelling}
                  onClick={() => {
                    void runAction(() => cancel(invoice.id), 'Invoice cancelled');
                  }}
                >
                  <XCircle className="size-4" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </Can>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          <div>
            <Caption className="block uppercase tracking-wide">Total</Caption>
            <p className="mt-1 text-2xl font-semibold">
              {formatInvoiceAmount(invoice.grandTotal, invoice.currency)}
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
          <div>
            <Caption className="block uppercase tracking-wide">Balance due</Caption>
            <p className="mt-1 text-lg font-medium">
              {formatInvoiceAmount(outstandingAmount ?? invoice.balanceDue, invoice.currency)}
            </p>
          </div>
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
