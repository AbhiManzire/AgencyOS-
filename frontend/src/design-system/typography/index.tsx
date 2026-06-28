import type { ComponentProps } from 'react';
import { Typography } from './typography';

export function PageTitle(props: Omit<ComponentProps<typeof Typography>, 'variant' | 'as'>) {
  return <Typography as="h1" variant="pageTitle" {...props} />;
}

export function SectionTitle(props: Omit<ComponentProps<typeof Typography>, 'variant' | 'as'>) {
  return <Typography as="h2" variant="sectionTitle" {...props} />;
}

export function CardTitle(props: Omit<ComponentProps<typeof Typography>, 'variant' | 'as'>) {
  return <Typography as="h3" variant="cardTitle" {...props} />;
}

export function Body(props: Omit<ComponentProps<typeof Typography>, 'variant' | 'as'>) {
  return <Typography as="p" variant="body" {...props} />;
}

export function Caption(props: Omit<ComponentProps<typeof Typography>, 'variant' | 'as'>) {
  return <Typography as="span" variant="caption" {...props} />;
}

export {
  Typography,
  typographyClass,
  typographyStyles,
  type TypographyVariant,
} from './typography';
