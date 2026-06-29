import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle, SectionTitle } from '@/design-system/typography';

interface StopTimerDialogProps {
  readonly open: boolean;
  readonly elapsed: string;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function StopTimerDialog({
  open,
  elapsed,
  isPending,
  onCancel,
  onConfirm,
}: StopTimerDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stop-timer-title"
        aria-describedby="stop-timer-description"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <SectionTitle id="stop-timer-title" className="mb-2 text-base">
          Stop timer?
        </SectionTitle>
        <CardTitle id="stop-timer-description" className="mb-6 font-normal text-muted-foreground">
          This will save {elapsed} of tracked time to this task.
        </CardTitle>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending} className="gap-2" onClick={onConfirm}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Stop Timer
          </Button>
        </div>
      </div>
    </div>
  );
}
