import { StatusBadge } from '@/design-system';
import type { WorkflowStatus } from '@/features/workflows/types';
import { WORKFLOW_STATUS_LABELS } from '@/features/workflows/types';

const STATUS_VARIANTS: Record<WorkflowStatus, 'primary' | 'success' | 'neutral'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

interface WorkflowStatusBadgeProps {
  readonly status: WorkflowStatus;
}

export function WorkflowStatusBadge({ status }: WorkflowStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>{WORKFLOW_STATUS_LABELS[status]}</StatusBadge>
  );
}
