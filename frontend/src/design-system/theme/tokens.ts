/** Design system spacing scale in pixels. */
export const SPACING = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  48: 48,
} as const;

export type SpacingKey = keyof typeof SPACING;

/** CSS custom property names for the spacing scale. */
export const SPACING_VARS = {
  4: '--space-4',
  8: '--space-8',
  12: '--space-12',
  16: '--space-16',
  24: '--space-24',
  32: '--space-32',
  48: '--space-48',
} as const;

/** Semantic color token names exposed by the theme. */
export const THEME_COLORS = [
  'primary',
  'success',
  'warning',
  'danger',
  'neutral',
  'background',
  'card',
  'border',
] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];

/** Container width tokens. */
export const CONTAINER_WIDTHS = {
  sm: 'var(--container-sm)',
  md: 'var(--container-md)',
  lg: 'var(--container-lg)',
  xl: 'var(--container-xl)',
  '2xl': 'var(--container-2xl)',
} as const;

/** Border radius tokens. */
export const RADIUS = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
} as const;

/** Shadow tokens. */
export const SHADOWS = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;
