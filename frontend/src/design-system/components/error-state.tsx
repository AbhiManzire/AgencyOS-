import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Body, SectionTitle } from '@/design-system/typography';

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: ReactNode;
  className?: string;
}

/** Standard error presentation for failed views. */
export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger-muted px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle className="size-6 text-danger" aria-hidden="true" />
      </div>
      <SectionTitle className="mb-2 text-danger-foreground">{title}</SectionTitle>
      <Body className="max-w-md text-danger-foreground/80">{message}</Body>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
