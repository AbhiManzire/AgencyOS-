import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface UnsavedChangesDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms discarding unsaved form changes before closing a drawer. */
export function UnsavedChangesDialog({ open, onCancel, onConfirm }: UnsavedChangesDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-description"
        className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="unsaved-changes-title" className="mb-2 text-base">
          Discard unsaved changes?
        </SectionTitle>
        <CardTitle
          id="unsaved-changes-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          Your changes will be lost if you leave without saving.
        </CardTitle>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Keep editing
          </Button>
          <Button
            type="button"
            className="bg-danger text-danger-foreground hover:bg-danger/90"
            onClick={onConfirm}
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
