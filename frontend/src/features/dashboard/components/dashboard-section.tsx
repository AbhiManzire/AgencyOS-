import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/design-system';
import { Caption, SectionTitle } from '@/design-system/typography';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/** Shared section wrapper for dashboard panels. */
export function DashboardSection({
  title,
  description,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <SectionTitle className="text-base">{title}</SectionTitle>
            {description ? <Caption>{description}</Caption> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
