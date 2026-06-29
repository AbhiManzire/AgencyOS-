'use client';

import { StatusBadge } from '@/design-system';

interface VersionBadgeProps {
  readonly version: number;
}

export function VersionBadge({ version }: VersionBadgeProps) {
  return (
    <StatusBadge variant="neutral" className="font-mono">
      v{version}
    </StatusBadge>
  );
}
