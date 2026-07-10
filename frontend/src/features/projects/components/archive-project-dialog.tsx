import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface ArchiveProjectDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms archiving a project before calling the archive API. */
export function ArchiveProjectDialog({
  open,
  isPending,
  onCancel,
  onConfirm,
}: ArchiveProjectDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="archive-project-title"
        aria-describedby="archive-project-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="archive-project-title" className="mb-2 text-base">
          Archive this project?
        </SectionTitle>
        <CardTitle
          id="archive-project-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          Archived projects cannot be edited until restored.
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
