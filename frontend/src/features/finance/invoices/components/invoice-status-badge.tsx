import { StatusBadge } from '@/design-system';
import type { InvoiceStatus } from '@/features/finance/invoices/types';
import { INVOICE_STATUS_LABELS } from '@/features/finance/invoices/forms/invoice-form.validation';

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  SENT: 'primary',
  PAID: 'success',
  OVERDUE: 'warning',
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
