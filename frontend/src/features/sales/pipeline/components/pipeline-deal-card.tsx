'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { Caption } from '@/design-system/typography';
import { DealPriorityBadge } from '@/features/sales/components/deal-priority-badge';
import type { PipelineDealCard as PipelineDealCardModel } from '@/features/sales/pipeline/pipeline.constants';
import { DEAL_DRAG_TYPE } from '@/features/sales/pipeline/pipeline.constants';
import {
  formatDealDate,
  formatDealProbability,
  formatDealValue,
  formatWeightedDealValue,
} from '@/features/sales/utils/deal-display';
import { usePermission } from '@/lib/rbac/use-permission';
import { cn } from '@/lib/utils';

interface PipelineDealCardProps {
  readonly deal: PipelineDealCardModel;
  readonly isDragging?: boolean;
}

export function PipelineDealCard({ deal, isDragging = false }: PipelineDealCardProps) {
  const router = useRouter();
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
      onClick={() => {
        if (didDragRef.current) {
          return;
        }

        router.push(`/sales/deals/${deal.id}`);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(`/sales/deals/${deal.id}`);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View deal ${deal.title}`}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow',
        canDrag && 'cursor-grab active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow-md',
        isDragging && 'opacity-50',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2 font-medium text-foreground">{deal.title}</p>
        <DealPriorityBadge priority={deal.priority} />
      </div>

      <div className="space-y-1.5">
        <Caption className="block truncate text-muted-foreground">{deal.clientName}</Caption>
        <Caption className="block truncate text-muted-foreground">{deal.contactName}</Caption>
        <Caption className="block font-medium text-foreground">
          {formatDealValue(deal.value, deal.currency)}
        </Caption>
        <Caption className="block text-muted-foreground">
          {formatDealProbability(deal.stage, deal.probability)} · Weighted{' '}
          {formatWeightedDealValue(deal.value, deal.stage, deal.probability, deal.currency)}
        </Caption>
        <Caption className="block text-muted-foreground">
          Close {formatDealDate(deal.expectedCloseDate)}
        </Caption>
        <Caption className="block truncate text-muted-foreground">{deal.ownerName}</Caption>
      </div>
    </article>
  );
}
