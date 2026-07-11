import { StatusBadge } from '@/design-system';
import type { LeadStatus } from '@/features/sales/leads/types';
import { LEAD_STATUS_LABELS } from '@/features/sales/leads/utils/lead-display';

const STATUS_VARIANTS: Record<
  LeadStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  NEW: 'neutral',
  CONTACTED: 'primary',
  QUALIFIED: 'success',
  DISQUALIFIED: 'danger',
  CONVERTED: 'success',
  ARCHIVED: 'neutral',
};

interface LeadStatusBadgeProps {
  readonly status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{LEAD_STATUS_LABELS[status]}</StatusBadge>;
}
