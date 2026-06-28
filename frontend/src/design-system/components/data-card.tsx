import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader } from './card';
import { Caption, CardTitle } from '@/design-system/typography';

interface DataCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}

/** Metric summary card for dashboard-style layouts. */
export function DataCard({ label, value, hint, className }: DataCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <Caption className="uppercase tracking-wide">{label}</Caption>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
        {hint ? <Caption>{hint}</Caption> : null}
      </CardHeader>
    </Card>
  );
}
