'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { SectionTitle } from '@/design-system/typography';
import { PIPELINE_COLUMNS } from '@/features/sales/pipeline/pipeline.constants';
import type { DealStage } from '@/features/sales/types';

interface MoveDealStageDialogProps {
  readonly open: boolean;
  readonly currentStage: DealStage;
  readonly isPending: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (stage: DealStage) => void;
}

export function MoveDealStageDialog({
  open,
  currentStage,
  isPending,
  onCancel,
  onConfirm,
}: MoveDealStageDialogProps) {
  const [stage, setStage] = useState<DealStage>(currentStage);

  useEffect(() => {
    if (open) {
      setStage(currentStage);
    }
  }, [currentStage, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (stage === currentStage) {
      onCancel();
      return;
    }
    onConfirm(stage);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-stage-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
        onSubmit={handleSubmit}
      >
        <SectionTitle id="move-stage-title" className="mb-2 text-base">
          Move deal stage
        </SectionTitle>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose the next pipeline stage for this opportunity.
        </p>

        <div className="mb-6 space-y-1.5">
          <label htmlFor="move-stage" className="text-sm font-medium text-foreground">
            Stage
          </label>
          <NativeSelect
            id="move-stage"
            label="Stage"
            value={stage}
            disabled={isPending}
            onChange={(event) => {
              setStage(event.target.value as DealStage);
            }}
          >
            {PIPELINE_COLUMNS.map((column) => (
              <option key={column.id} value={column.stage}>
                {column.label}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || stage === currentStage} className="gap-2">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Move
          </Button>
        </div>
      </form>
    </div>
  );
}
