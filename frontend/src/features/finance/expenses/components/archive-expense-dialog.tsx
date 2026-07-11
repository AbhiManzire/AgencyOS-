import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface ArchiveExpenseDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms archiving an expense before calling the archive API. */
export function ArchiveExpenseDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: ArchiveExpenseDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-expense-title"
        aria-describedby="archive-expense-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="archive-expense-title" className="mb-2 text-base">
          Archive this expense?
        </SectionTitle>
        <CardTitle
          id="archive-expense-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          Archived expenses are hidden from the default list.
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
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
