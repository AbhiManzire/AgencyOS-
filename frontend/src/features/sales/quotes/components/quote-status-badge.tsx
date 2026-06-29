import { StatusBadge } from '@/design-system';
import type { QuoteStatus } from '@/features/sales/quotes/types';
import { QUOTE_STATUS_LABELS } from '@/features/sales/quotes/forms/quote-form.validation';

const STATUS_VARIANTS: Record<
  QuoteStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  SENT: 'primary',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  EXPIRED: 'warning',
};

interface QuoteStatusBadgeProps {
  readonly status: QuoteStatus;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{QUOTE_STATUS_LABELS[status]}</StatusBadge>;
}
