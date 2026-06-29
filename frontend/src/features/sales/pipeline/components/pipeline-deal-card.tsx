'use client';

import { useRef } from 'react';
import { Caption } from '@/design-system/typography';
import type { PipelineDealCard as PipelineDealCardModel } from '@/features/sales/pipeline/pipeline.constants';
import { DEAL_DRAG_TYPE } from '@/features/sales/pipeline/pipeline.constants';
import { formatDealDate, formatDealValue } from '@/features/sales/utils/deal-display';
import { usePermission } from '@/lib/rbac/use-permission';
import { cn } from '@/lib/utils';

interface PipelineDealCardProps {
  readonly deal: PipelineDealCardModel;
  readonly isDragging?: boolean;
}

export function PipelineDealCard({ deal, isDragging = false }: PipelineDealCardProps) {
  const { allowed: canDrag } = usePermission('sales.update');
  const didDragRef = useRef(false);

  return (
    <article
      draggable={canDrag}
      onDragStart={(event) => {
        didDragRef.current = true;
        event.dataTransfer.setData(DEAL_DRAG_TYPE, deal.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        window.setTimeout(() => {
          didDragRef.current = false;
        }, 0);
      }}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow-md',
        isDragging && 'opacity-50',
      )}
    >
      <p className="mb-2 line-clamp-2 font-medium text-foreground">{deal.title}</p>

      <div className="space-y-1.5">
        <Caption className="block truncate text-muted-foreground">{deal.clientName}</Caption>
        <Caption className="block truncate text-muted-foreground">{deal.contactName}</Caption>
        <Caption className="block font-medium text-foreground">
          {formatDealValue(deal.value, deal.currency)}
        </Caption>
        <Caption className="block text-muted-foreground">
          Close {formatDealDate(deal.expectedCloseDate)}
        </Caption>
        <Caption className="block truncate text-muted-foreground">{deal.ownerName}</Caption>
      </div>
    </article>
  );
}
