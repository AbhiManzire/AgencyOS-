import { StatusBadge } from '@/design-system';
import type { InvoiceStatus } from '@/features/finance/invoices/types';
import { INVOICE_STATUS_LABELS } from '@/features/finance/shared/finance.types';

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  SENT: 'primary',
  VIEWED: 'primary',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'warning',
  CANCELLED: 'danger',
  VOID: 'danger',
};

interface InvoiceStatusBadgeProps {
  readonly status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>{INVOICE_STATUS_LABELS[status]}</StatusBadge>
  );
}
