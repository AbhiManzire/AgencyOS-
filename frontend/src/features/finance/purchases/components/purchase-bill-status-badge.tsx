import { StatusBadge } from '@/design-system';
import type { PurchaseBillStatus } from '@/features/finance/purchases/types';
import { PURCHASE_BILL_STATUS_LABELS } from '@/features/finance/shared/finance.types';

const STATUS_VARIANTS: Record<
  PurchaseBillStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  SENT: 'primary',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'warning',
  CANCELLED: 'danger',
};

interface PurchaseBillStatusBadgeProps {
  readonly status: PurchaseBillStatus;
}

export function PurchaseBillStatusBadge({ status }: PurchaseBillStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>
      {PURCHASE_BILL_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
