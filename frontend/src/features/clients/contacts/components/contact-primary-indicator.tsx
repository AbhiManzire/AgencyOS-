import { Check } from 'lucide-react';
import { Caption } from '@/design-system';

interface ContactPrimaryIndicatorProps {
  readonly isPrimary: boolean;
}

export function ContactPrimaryIndicator({ isPrimary }: ContactPrimaryIndicatorProps) {
  if (!isPrimary) {
    return <Caption>—</Caption>;
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm text-success">
      <Check className="size-4" aria-hidden="true" />
      Primary
    </span>
  );
}
