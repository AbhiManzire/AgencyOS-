import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface DeleteMemberDialogProps {
  readonly open: boolean;
  readonly memberName: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function DeleteMemberDialog({
  open,
  memberName,
  isPending,
  onCancel,
  onConfirm,
}: DeleteMemberDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-member-title"
        aria-describedby="delete-member-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="delete-member-title" className="mb-2 text-base">
          Remove member?
        </SectionTitle>
        <CardTitle
          id="delete-member-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          {memberName} will be removed from this project.
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
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
