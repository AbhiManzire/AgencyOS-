import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  initials?: string;
}

/** User or entity avatar placeholder. */
export function Avatar({ className, size, initials = '?', ...props }: AvatarProps) {
  return (
    <div
      className={cn(avatarVariants({ size }), className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    >
      <span>{initials.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

export { avatarVariants };
