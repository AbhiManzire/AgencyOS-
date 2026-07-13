import { StatusBadge } from '@/design-system';
import type { IntegrationConnectionStatus } from '@/features/integrations/api/integration.types';
import { INTEGRATION_CONNECTION_STATUS_LABELS } from '@/features/integrations/api/integration.types';

const STATUS_VARIANTS: Record<
  IntegrationConnectionStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  CONNECTED: 'success',
  DISCONNECTED: 'neutral',
  ERROR: 'danger',
  PENDING: 'warning',
};

interface ConnectionStatusBadgeProps {
  readonly status: IntegrationConnectionStatus;
}

export function ConnectionStatusBadge({ status }: ConnectionStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>
      {INTEGRATION_CONNECTION_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
