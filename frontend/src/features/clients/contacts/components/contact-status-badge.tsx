import { StatusBadge } from '@/design-system';
import type { ContactStatus } from '@/features/clients/contacts/types';

const STATUS_LABELS: Record<ContactStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const STATUS_VARIANTS: Record<
  ContactStatus,
  'primary' | 'success' | 'warning' | 'danger' | 'neutral'
> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

interface ContactStatusBadgeProps {
  readonly status: ContactStatus;
}

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  return <StatusBadge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</StatusBadge>;
}
