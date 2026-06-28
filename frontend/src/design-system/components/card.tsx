import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cardPaddingClassName } from '@/lib/spacing';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

const shadowClasses = {
  none: '',
  sm: 'ds-shadow-sm',
  md: 'ds-shadow-md',
  lg: 'ds-shadow-lg',
} as const;

/** Base elevated surface for module content. */
export function Card({ children, className, padding = true, shadow = 'sm', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground',
        shadowClasses[shadow],
        padding && cardPaddingClassName(),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1', className)} {...props}>
      {children}
    </div>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
