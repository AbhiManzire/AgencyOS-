'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/design-system';
import type { ListDealsParams } from '@/features/sales/api/deal.types';
import { PipelineKanbanColumn } from '@/features/sales/pipeline/components/pipeline-kanban-column';
import { useUpdateDealStageOptimistic } from '@/features/sales/pipeline/hooks/use-update-deal-stage-optimistic';
import {
  PIPELINE_COLUMNS,
  type PipelineColumnDefinition,
  type PipelineColumnStage,
  type PipelineDealCard,
} from '@/features/sales/pipeline/pipeline.constants';
import { DEAL_OPEN_STAGES } from '@/features/sales/types';
import { normalizeDealStage } from '@/features/sales/utils/deal-display';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface PipelineKanbanBoardProps {
  readonly deals: readonly PipelineDealCard[];
  readonly listParams: ListDealsParams;
  readonly columns?: readonly PipelineColumnDefinition[];
}

function emptyGrouped(
  columns: readonly PipelineColumnDefinition[],
): Record<PipelineColumnStage, PipelineDealCard[]> {
  const grouped = {} as Record<PipelineColumnStage, PipelineDealCard[]>;
  for (const column of columns) {
    grouped[column.stage] = [];
  }
  return grouped;
}

export function PipelineKanbanBoard({
  deals,
  listParams,
  columns = PIPELINE_COLUMNS,
}: PipelineKanbanBoardProps) {
  const { showToast } = useToast();
  const { mutateAsync: updateStage } = useUpdateDealStageOptimistic(listParams);
  const [draggingDealId, setDraggingDealId] = useState<string | null>(null);

  const dealsByColumn = useMemo(() => {
    const grouped = emptyGrouped(columns);

    for (const deal of deals) {
      const stage = normalizeDealStage(deal.stage);
      if (stage === 'ARCHIVED') {
        continue;
      }
      grouped[stage].push({ ...deal, stage });
    }

    return grouped;
  }, [columns, deals]);

  const handleDropDeal = async (dealId: string, stage: PipelineColumnStage): Promise<void> => {
    const deal = deals.find((item) => item.id === dealId);
    if (deal === undefined) {
      return;
    }

    const currentStage = normalizeDealStage(deal.stage);
    if (currentStage === stage) {
      return;
    }

    // Allow free moves among open stages (including backward) and to Won/Lost.
    const isOpenMove = DEAL_OPEN_STAGES.includes(currentStage) && DEAL_OPEN_STAGES.includes(stage);
    const isTerminalMove = stage === 'WON' || stage === 'LOST';
    const fromTerminal = currentStage === 'WON' || currentStage === 'LOST';

    if (!isOpenMove && !isTerminalMove && !fromTerminal) {
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
      {columns.map((column) => (
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
