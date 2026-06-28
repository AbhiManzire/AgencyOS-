/** Responsive breakpoint values aligned with the app shell. */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/** Tailwind-compatible min-width media query strings. */
export const BREAKPOINT_QUERIES = {
  tablet: `(min-width: ${String(BREAKPOINTS.tablet)}px)`,
  desktop: `(min-width: ${String(BREAKPOINTS.desktop)}px)`,
  wide: `(min-width: ${String(BREAKPOINTS.wide)}px)`,
} as const;
