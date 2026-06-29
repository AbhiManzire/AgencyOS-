import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface DeleteInvoiceLineItemDialogProps {
  readonly open: boolean;
  readonly name: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function DeleteInvoiceLineItemDialog({
  open,
  name,
  isPending,
  onCancel,
  onConfirm,
}: DeleteInvoiceLineItemDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-invoice-line-item-title"
        aria-describedby="delete-invoice-line-item-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="delete-invoice-line-item-title" className="mb-2 text-base">
          Delete line item?
        </SectionTitle>
        <CardTitle
          id="delete-invoice-line-item-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          {name} will be permanently removed.
        </CardTitle>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending}
            className="gap-2 bg-danger text-danger-foreground hover:bg-danger/90"
            onClick={onConfirm}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
