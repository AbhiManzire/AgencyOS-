'use client';

import { Loader2 } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionTitle } from '@/design-system/typography';

interface LoseDealDialogProps {
  readonly open: boolean;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (payload: {
    lossReason: string;
    competitor?: string | null;
    lossNotes?: string | null;
  }) => void;
}

export function LoseDealDialog({ open, isPending, onCancel, onConfirm }: LoseDealDialogProps) {
  const [lossReason, setLossReason] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [lossNotes, setLossNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const reason = lossReason.trim();
    if (reason.length === 0) {
      setError('Loss reason is required');
      return;
    }

    setError(null);
    onConfirm({
      lossReason: reason,
      competitor: competitor.trim().length > 0 ? competitor.trim() : null,
      lossNotes: lossNotes.trim().length > 0 ? lossNotes.trim() : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="lose-deal-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="lose-deal-title" className="mb-2 text-base">
          Mark deal as lost?
        </SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Capture why this opportunity was lost for forecasting and coaching.
        </p>

        <div className="mb-4 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="lossReason" className="text-sm font-medium text-foreground">
              Reason <span className="text-danger">*</span>
            </label>
            <Input
              id="lossReason"
              value={lossReason}
              disabled={isPending}
              placeholder="Price, timing, competitor…"
              onChange={(event) => {
                setLossReason(event.target.value);
                setError(null);
              }}
            />
            {error ? <p className="text-xs text-danger">{error}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="competitor" className="text-sm font-medium text-foreground">
              Competitor
            </label>
            <Input
              id="competitor"
              value={competitor}
              disabled={isPending}
              placeholder="Optional"
              onChange={(event) => {
                setCompetitor(event.target.value);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lossNotes" className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="lossNotes"
              value={lossNotes}
              disabled={isPending}
              rows={3}
              placeholder="Optional details"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              onChange={(event) => {
                setLossNotes(event.target.value);
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="gap-2 bg-danger text-danger-foreground hover:bg-danger/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Lose deal
          </Button>
        </div>
      </form>
    </div>
  );
}
