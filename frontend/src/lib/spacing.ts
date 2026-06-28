import { cn } from '@/lib/utils';

/** Responsive page padding utility classes. */
export function pagePaddingClassName(className?: string): string {
  return cn('ds-page-padding', className);
}

/** Standard card interior padding utility classes. */
export function cardPaddingClassName(className?: string): string {
  return cn('ds-card-padding', className);
}

/** Gap utility mapped to the design system spacing scale. */
export function spacingGapClass(size: 4 | 8 | 12 | 16 | 24 | 32 | 48, className?: string): string {
  const gapMap = {
    4: 'gap-1',
    8: 'gap-2',
    12: 'gap-3',
    16: 'gap-4',
    24: 'gap-6',
    32: 'gap-8',
    48: 'gap-12',
  } as const;

  return cn(gapMap[size], className);
}
