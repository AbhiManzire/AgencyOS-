import { StatusBadge } from '@/design-system';
import type { DealPriority } from '@/features/sales/types';
import { DEAL_PRIORITY_LABELS } from '@/features/sales/utils/deal-display';

const PRIORITY_VARIANTS: Record<
  DealPriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface DealPriorityBadgeProps {
  readonly priority: DealPriority;
}

export function DealPriorityBadge({ priority }: DealPriorityBadgeProps) {
  return (
    <StatusBadge variant={PRIORITY_VARIANTS[priority]}>
      {DEAL_PRIORITY_LABELS[priority]}
    </StatusBadge>
  );
}
