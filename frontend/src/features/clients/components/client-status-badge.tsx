import { StatusBadge } from '@/design-system';
import type { ClientStatus } from '@/features/clients/types';

const STATUS_LABELS: Record<ClientStatus, string> = {
  PROSPECT: 'Prospect',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANTS: Record<
  ClientStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  PROSPECT: 'primary',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  ARCHIVED: 'neutral',
};

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
