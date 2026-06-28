import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Body, PageTitle } from '@/design-system/typography';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Standard page header with title, optional description, and action slot. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        <PageTitle>{title}</PageTitle>
        {description ? <Body className="text-muted-foreground">{description}</Body> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
