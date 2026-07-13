'use client';

import { StatusBadge } from '@/design-system';
import type { ClientHealthStatus } from '@/features/clients/success/api/client-success.types';
import { cn } from '@/lib/utils';

const HEALTH_LABELS: Record<ClientHealthStatus, string> = {
  GREEN: 'Healthy',
  YELLOW: 'At risk',
  RED: 'Critical',
};

const HEALTH_VARIANTS: Record<ClientHealthStatus, 'success' | 'warning' | 'danger'> = {
  GREEN: 'success',
  YELLOW: 'warning',
  RED: 'danger',
};

interface ClientHealthBadgeProps {
  readonly status: ClientHealthStatus | null | undefined;
  readonly score?: number | null;
  readonly className?: string;
}

export function ClientHealthBadge({ status, score, className }: ClientHealthBadgeProps) {
  if (status === null || status === undefined) {
    return (
      <StatusBadge variant="neutral" className={cn('font-medium', className)}>
        Unknown
      </StatusBadge>
    );
  }

  const label =
    score !== null && score !== undefined
      ? `${HEALTH_LABELS[status]} (${String(score)})`
      : HEALTH_LABELS[status];

  return (
    <StatusBadge variant={HEALTH_VARIANTS[status]} className={cn('font-medium', className)}>
      {label}
    </StatusBadge>
  );
}
