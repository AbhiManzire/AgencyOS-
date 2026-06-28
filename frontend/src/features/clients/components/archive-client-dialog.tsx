import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface ArchiveClientDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms archiving a client before calling the archive API. */
export function ArchiveClientDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: ArchiveClientDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-client-title"
        aria-describedby="archive-client-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="archive-client-title" className="mb-2 text-base">
          Archive this client?
        </SectionTitle>
        <CardTitle
          id="archive-client-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          Archived clients cannot be edited until restored.
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
