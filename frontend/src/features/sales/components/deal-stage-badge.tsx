import { StatusBadge } from '@/design-system';
import type { DealStage } from '@/features/sales/types';
import { formatDealStage, normalizeDealStage } from '@/features/sales/utils/deal-display';

const STAGE_VARIANTS: Record<DealStage, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> =
  {
    QUALIFICATION: 'neutral',
    DISCOVERY: 'primary',
    PROPOSAL: 'primary',
    NEGOTIATION: 'warning',
    VERBAL_COMMIT: 'warning',
    WON: 'success',
    LOST: 'danger',
    ARCHIVED: 'neutral',
  };

interface DealStageBadgeProps {
  readonly stage: DealStage;
}

export function DealStageBadge({ stage }: DealStageBadgeProps) {
  const normalized = normalizeDealStage(stage);
  return (
    <StatusBadge variant={STAGE_VARIANTS[normalized]}>{formatDealStage(normalized)}</StatusBadge>
  );
}
