import { StatusBadge } from '@/design-system';
import type { DealStage } from '@/features/sales/types';
import { formatDealStage } from '@/features/sales/utils/deal-display';

const STAGE_VARIANTS: Record<DealStage, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> =
  {
    NEW: 'neutral',
    QUALIFIED: 'primary',
    PROPOSAL: 'primary',
    NEGOTIATION: 'warning',
    WON: 'success',
    LOST: 'danger',
  };

interface DealStageBadgeProps {
  readonly stage: DealStage;
}

export function DealStageBadge({ stage }: DealStageBadgeProps) {
  return <StatusBadge variant={STAGE_VARIANTS[stage]}>{formatDealStage(stage)}</StatusBadge>;
}
