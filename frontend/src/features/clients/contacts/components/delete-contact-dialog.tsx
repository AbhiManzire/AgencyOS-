import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface DeleteContactDialogProps {
  readonly open: boolean;
  readonly contactName: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Confirms removing a contact before delete. */
export function DeleteContactDialog({
  open,
  contactName,
  isPending,
  onCancel,
  onConfirm,
}: DeleteContactDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-contact-title"
        aria-describedby="delete-contact-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="delete-contact-title" className="mb-2 text-base">
          Remove contact?
        </SectionTitle>
        <CardTitle
          id="delete-contact-description"
          className="mb-6 font-normal text-muted-foreground"
        >
          {contactName} will be removed from this client.
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
