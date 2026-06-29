import { StatusBadge } from '@/design-system';
import type { FollowUpStatus } from '@/features/sales/follow-ups/types';
import { FOLLOW_UP_STATUS_LABELS } from '@/features/sales/follow-ups/forms/follow-up-form.validation';

const STATUS_VARIANTS: Record<
  FollowUpStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

interface FollowUpStatusBadgeProps {
  readonly status: FollowUpStatus;
}

export function FollowUpStatusBadge({ status }: FollowUpStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>{FOLLOW_UP_STATUS_LABELS[status]}</StatusBadge>
  );
}
