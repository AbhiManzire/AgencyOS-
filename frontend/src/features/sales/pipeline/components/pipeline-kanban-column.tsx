'use client';

import { useState, type DragEvent } from 'react';
import { Caption } from '@/design-system/typography';
import { PipelineDealCard } from '@/features/sales/pipeline/components/pipeline-deal-card';
import type {
  PipelineColumnDefinition,
  PipelineDealCard as PipelineDealCardModel,
} from '@/features/sales/pipeline/pipeline.constants';
import { DEAL_DRAG_TYPE } from '@/features/sales/pipeline/pipeline.constants';
import { formatDealValue, sumDealValues } from '@/features/sales/utils/deal-display';
import { cn } from '@/lib/utils';

interface PipelineKanbanColumnProps {
  readonly column: PipelineColumnDefinition;
  readonly deals: readonly PipelineDealCardModel[];
  readonly draggingDealId: string | null;
  readonly onDropDeal: (dealId: string, stage: PipelineColumnDefinition['stage']) => void;
}

export function PipelineKanbanColumn({
  column,
  deals,
  draggingDealId,
  onDropDeal,
}: PipelineKanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageTotal = sumDealValues(deals);
  const currency = deals[0]?.currency ?? 'USD';

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOver(false);

    const dealId = event.dataTransfer.getData(DEAL_DRAG_TYPE);
    if (dealId.length === 0) {
      return;
    }

    onDropDeal(dealId, column.stage);
  };

  return (
    <section
      className={cn(
        'flex min-h-[320px] w-[280px] shrink-0 flex-col rounded-lg border border-border bg-muted/20',
        isDragOver && 'border-primary bg-primary/5',
      )}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="space-y-1 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
          <Caption className="tabular-nums">{deals.length}</Caption>
        </div>
        <Caption className="block font-medium text-muted-foreground">
          {formatDealValue(stageTotal, currency)}
        </Caption>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {deals.length === 0 ? (
          <Caption className="py-6 text-center text-muted-foreground">No deals</Caption>
        ) : (
          deals.map((deal) => (
            <PipelineDealCard key={deal.id} deal={deal} isDragging={draggingDealId === deal.id} />
          ))
        )}
      </div>
    </section>
  );
}
