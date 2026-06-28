import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Body } from '@/design-system/typography';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

/** Standard loading indicator for async views. */
export function LoadingState({ label = 'Loading...', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card px-6 py-12',
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      <Body className="text-muted-foreground">{label}</Body>
    </div>
  );
}
