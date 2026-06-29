'use client';

import { Download, Eye, FileText, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, useToast } from '@/design-system';
import {
  downloadInvoicePdf,
  previewInvoicePdf,
} from '@/features/finance/invoices/api/invoice-delivery.api';
import { SendInvoiceEmailDialog } from '@/features/finance/invoices/components/send-invoice-email-dialog';
import { useGenerateInvoicePdf } from '@/features/finance/invoices/hooks/use-generate-invoice-pdf';
import { useSendInvoiceEmail } from '@/features/finance/invoices/hooks/use-send-invoice-email';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface InvoiceDeliveryActionsProps {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly hasLineItems: boolean;
}

export function InvoiceDeliveryActions({
  invoiceId,
  invoiceNumber,
  hasLineItems,
}: InvoiceDeliveryActionsProps) {
  const { showToast } = useToast();
  const { allowed: canManage } = usePermission('invoices.update');
  const { mutateAsync: generatePdf, isPending: isGenerating } = useGenerateInvoicePdf(invoiceId);
  const { mutateAsync: sendEmail, isPending: isSending } = useSendInvoiceEmail(invoiceId);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isBusy = isGenerating || isPreviewing || isDownloading || isSending;

  const ensurePdf = async (): Promise<void> => {
    try {
      await generatePdf();
    } catch (error) {
      if (!isApiNotFoundError(error)) {
        throw error;
      }
    }
  };

  const handlePreview = async (): Promise<void> => {
    if (!hasLineItems) {
      showToast('Add line items before previewing the invoice PDF.', 'error');
      return;
    }

    setActionError(null);
    setIsPreviewing(true);

    try {
      try {
        await previewInvoicePdf(invoiceId);
      } catch (error) {
        if (isApiNotFoundError(error)) {
          await generatePdf();
          await previewInvoicePdf(invoiceId);
        } else {
          throw error;
        }
      }
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setActionError(message);
      showToast(message, 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownload = async (): Promise<void> => {
    if (!hasLineItems) {
      showToast('Add line items before downloading the invoice PDF.', 'error');
      return;
    }

    setActionError(null);
    setIsDownloading(true);

    try {
      try {
        await downloadInvoicePdf(invoiceId, `${invoiceNumber}.pdf`);
      } catch (error) {
        if (isApiNotFoundError(error)) {
          await generatePdf();
          await downloadInvoicePdf(invoiceId, `${invoiceNumber}.pdf`);
        } else {
          throw error;
        }
      }
      showToast('Invoice PDF downloaded', 'success');
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setActionError(message);
      showToast(message, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async (): Promise<void> => {
    if (!hasLineItems) {
      showToast('Add line items before generating the invoice PDF.', 'error');
      return;
    }

    setActionError(null);

    try {
      await generatePdf();
      showToast('Invoice PDF generated', 'success');
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setActionError(message);
      showToast(message, 'error');
    }
  };

  const handleSendEmail = async (email: string): Promise<void> => {
    if (!hasLineItems) {
      showToast('Add line items before sending the invoice.', 'error');
      return;
    }

    setActionError(null);

    try {
      await ensurePdf();
      const result = await sendEmail({ email });
      showToast(`Invoice sent to ${result.email}`, 'success');
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setActionError(message);
      throw error;
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            void handlePreview();
          }}
        >
          {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            void handleDownload();
          }}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            void handlePreview();
          }}
        >
          {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            void handleDownload();
          }}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            void handleGenerate();
          }}
        >
          {isGenerating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          Generate PDF
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-2"
          disabled={!hasLineItems || isBusy}
          onClick={() => {
            setEmailDialogOpen(true);
          }}
        >
          {isSending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
          Send Email
        </Button>
      </div>

      {actionError ? (
        <ErrorState
          message={actionError}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                void handleGenerate();
              }}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          }
        />
      ) : null}

      <SendInvoiceEmailDialog
        open={emailDialogOpen}
        invoiceNumber={invoiceNumber}
        isPending={isSending}
        onOpenChange={setEmailDialogOpen}
        onSend={handleSendEmail}
      />
    </div>
  );
}
