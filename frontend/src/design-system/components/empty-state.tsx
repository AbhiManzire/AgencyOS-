import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Body, SectionTitle } from '@/design-system/typography';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Placeholder for views with no data yet. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <SectionTitle className="mb-2">{title}</SectionTitle>
      {description ? <Body className="max-w-md text-muted-foreground">{description}</Body> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
