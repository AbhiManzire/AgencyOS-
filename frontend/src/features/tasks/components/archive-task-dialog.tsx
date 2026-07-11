import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface ArchiveTaskDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms archiving a task before calling the archive API. */
export function ArchiveTaskDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: ArchiveTaskDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-task-title"
        aria-describedby="archive-task-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="archive-task-title" className="mb-2 text-base">
          Archive this task?
        </SectionTitle>
        <CardTitle id="archive-task-description" className="mb-6 font-normal text-muted-foreground">
          Archived tasks are hidden from active lists until restored.
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
