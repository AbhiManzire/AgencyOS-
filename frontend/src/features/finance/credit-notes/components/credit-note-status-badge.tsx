import { StatusBadge } from '@/design-system';
import type { CreditNoteStatus } from '@/features/finance/credit-notes/types';
import { CREDIT_NOTE_STATUS_LABELS } from '@/features/finance/shared/finance.types';

const STATUS_VARIANTS: Record<
  CreditNoteStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  DRAFT: 'neutral',
  ISSUED: 'primary',
  APPLIED: 'success',
  VOID: 'danger',
};

interface CreditNoteStatusBadgeProps {
  readonly status: CreditNoteStatus;
}

export function CreditNoteStatusBadge({ status }: CreditNoteStatusBadgeProps) {
  return (
    <StatusBadge variant={STATUS_VARIANTS[status]}>{CREDIT_NOTE_STATUS_LABELS[status]}</StatusBadge>
  );
}
