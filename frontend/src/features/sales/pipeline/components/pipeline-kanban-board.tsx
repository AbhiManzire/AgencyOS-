'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/design-system';
import { PipelineKanbanColumn } from '@/features/sales/pipeline/components/pipeline-kanban-column';
import {
  PIPELINE_COLUMNS,
  type PipelineColumnStage,
  type PipelineDealCard,
} from '@/features/sales/pipeline/pipeline.constants';
import { useUpdateDealStageOptimistic } from '@/features/sales/pipeline/hooks/use-update-deal-stage-optimistic';
import type { ListDealsParams } from '@/features/sales/api/deal.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface PipelineKanbanBoardProps {
  readonly deals: readonly PipelineDealCard[];
  readonly listParams: ListDealsParams;
}

export function PipelineKanbanBoard({ deals, listParams }: PipelineKanbanBoardProps) {
  const { showToast } = useToast();
  const { mutateAsync: updateStage } = useUpdateDealStageOptimistic(listParams);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  const dealsByColumn = useMemo(() => {
    const grouped: Record<PipelineColumnStage, PipelineDealCard[]> = {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      DISCOVERY: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    };

    for (const deal of deals) {
      if (deal.stage === 'ARCHIVED') {
        continue;
      }
      grouped[deal.stage].push(deal);
    }

    return grouped;
  }, [deals]);

  const handleDropDeal = async (dealId: string, stage: PipelineColumnStage): Promise<void> => {
    const deal = deals.find((item) => item.id === dealId);
    if (deal === undefined || deal.stage === stage) {
      return;
    }

    setDraggingDealId(dealId);

    try {
      await updateStage({ dealId, stage });
    } catch (error) {
      showToast(extractApiErrorMessage(error), 'error');
    } finally {
      setDraggingDealId(null);
    }
  };

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-2"
      onDragEnd={() => {
        setDraggingDealId(null);
      }}
    >
      {PIPELINE_COLUMNS.map((column) => (
        <PipelineKanbanColumn
          key={column.id}
          column={column}
          deals={dealsByColumn[column.stage]}
          draggingDealId={draggingDealId}
          onDropDeal={(dealId, nextStage) => {
            void handleDropDeal(dealId, nextStage);
          }}
        />
      ))}
    </div>
  );
}
