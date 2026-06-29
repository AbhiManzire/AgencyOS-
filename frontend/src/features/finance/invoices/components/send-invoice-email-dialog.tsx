'use client';

import { Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle, useToast } from '@/design-system';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface SendInvoiceEmailDialogProps {
  readonly open: boolean;
  readonly invoiceNumber: string;
  readonly isPending: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSend: (email: string) => Promise<void>;
}

export function SendInvoiceEmailDialog({
  open,
  invoiceNumber,
  isPending,
  onOpenChange,
  onSend,
}: SendInvoiceEmailDialogProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = async (): Promise<void> => {
    const trimmed = email.trim();
    if (trimmed.length === 0) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }

    try {
      await onSend(trimmed);
      setEmail('');
      setError(null);
      onOpenChange(false);
    } catch (sendError) {
      showToast(extractApiErrorMessage(sendError), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-invoice-email-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="send-invoice-email-title" className="mb-2 text-base">
          Send Invoice
        </SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Email {invoiceNumber} as a PDF attachment.
        </p>

        <div className="space-y-2">
          <label htmlFor="invoice-recipient-email" className="text-sm font-medium">
            Recipient email
          </label>
          <Input
            id="invoice-recipient-email"
            type="email"
            value={email}
            disabled={isPending}
            placeholder="client@example.com"
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            className="gap-2"
            onClick={() => {
              void handleSubmit();
            }}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Send Email
          </Button>
        </div>
      </div>
    </div>
  );
}
