import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface VoidCreditNoteDialogProps {
  readonly open: boolean;
  readonly creditNoteNumber: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function VoidCreditNoteDialog({
  open,
  creditNoteNumber,
  isPending,
  onCancel,
  onConfirm,
}: VoidCreditNoteDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="void-credit-note-title"
        aria-describedby="void-credit-note-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="void-credit-note-title" className="mb-2 text-base">
          Void credit note?
        </SectionTitle>
        <CardTitle
          id="void-credit-note-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          {creditNoteNumber} will be marked as void and can no longer be applied.
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
            Void
          </Button>
        </div>
      </div>
    </div>
  );
}
