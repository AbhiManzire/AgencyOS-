import { StatusBadge } from '@/design-system';
import type { LeadPriority } from '@/features/sales/leads/types';
import { LEAD_PRIORITY_LABELS } from '@/features/sales/leads/utils/lead-display';

const PRIORITY_VARIANTS: Record<
  LeadPriority,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  LOW: 'neutral',
  MEDIUM: 'primary',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface LeadPriorityBadgeProps {
  readonly priority: LeadPriority;
}

export function LeadPriorityBadge({ priority }: LeadPriorityBadgeProps) {
  return (
    <StatusBadge variant={PRIORITY_VARIANTS[priority]}>
      {LEAD_PRIORITY_LABELS[priority]}
    </StatusBadge>
  );
}
