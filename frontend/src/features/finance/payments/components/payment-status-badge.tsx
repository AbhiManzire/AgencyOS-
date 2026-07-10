import { StatusBadge } from '@/design-system';
import type { PaymentStatus } from '@/features/finance/payments/api/payment.types';
import { PAYMENT_STATUS_LABELS } from '@/features/finance/payments/api/payment.types';

const STATUS_VARIANT: Record<PaymentStatus, 'success' | 'neutral' | 'danger'> = {
  COMPLETED: 'success',
  VOIDED: 'neutral',
};

export function PaymentStatusBadge({ status }: { readonly status: PaymentStatus }) {
  return (
    <StatusBadge variant={STATUS_VARIANT[status]}>{PAYMENT_STATUS_LABELS[status]}</StatusBadge>
  );
}
