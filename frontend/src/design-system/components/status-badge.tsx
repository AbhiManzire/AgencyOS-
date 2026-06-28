import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'border-primary/20 bg-primary/10 text-primary',
        success: 'border-success/20 bg-success-muted text-success',
        warning: 'border-warning/30 bg-warning-muted text-warning-foreground',
        danger: 'border-danger/20 bg-danger-muted text-danger',
        neutral: 'border-border bg-neutral-muted text-neutral',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface StatusBadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {}

/** Semantic status chip for entity and workflow states. */
export function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}

export { statusBadgeVariants };
