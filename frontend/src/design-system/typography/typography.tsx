import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const typographyStyles = {
  pageTitle: 'text-2xl font-semibold tracking-tight text-foreground md:text-3xl',
  sectionTitle: 'text-lg font-semibold tracking-tight text-foreground md:text-xl',
  cardTitle: 'text-base font-semibold leading-none text-card-foreground',
  body: 'text-sm leading-relaxed text-foreground',
  caption: 'text-xs leading-normal text-muted-foreground',
} as const;

export type TypographyVariant = keyof typeof typographyStyles;

export function typographyClass(variant: TypographyVariant): string {
  return typographyStyles[variant];
}

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  variant: TypographyVariant;
}

export function Typography({ as, variant, className, ...props }: TypographyProps) {
  const Component = as ?? defaultElementForVariant(variant);
  return <Component className={cn(typographyStyles[variant], className)} {...props} />;
}

function defaultElementForVariant(variant: TypographyVariant): 'h1' | 'h2' | 'h3' | 'p' | 'span' {
  switch (variant) {
    case 'pageTitle':
      return 'h1';
    case 'sectionTitle':
      return 'h2';
    case 'cardTitle':
      return 'h3';
    case 'caption':
      return 'span';
    default:
      return 'p';
  }
}
