import { StatusBadge } from '@/design-system';
import type { ApprovalStatus } from '@/features/finance/shared/finance.types';
import { APPROVAL_STATUS_LABELS } from '@/features/finance/shared/finance.types';

const STATUS_VARIANTS: Record<
  ApprovalStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  NOT_REQUIRED: 'neutral',
};

interface ExpenseStatusBadgeProps {
  readonly status: ApprovalStatus;
}

export function ExpenseStatusBadge({ status }: ExpenseStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>{APPROVAL_STATUS_LABELS[status]}</StatusBadge>
  );
}
