import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { pagePaddingClassName } from '@/lib/spacing';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface PageContainerProps {
  children: ReactNode;
  size?: ContainerSize;
  className?: string;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'ds-container-sm',
  md: 'ds-container-md',
  lg: 'ds-container-lg',
  xl: 'ds-container-xl',
  '2xl': 'ds-container-2xl',
};

/** Responsive page-width container with standard padding. */
export function PageContainer({ children, size = 'xl', className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full', sizeClasses[size], pagePaddingClassName(), className)}>
      {children}
    </div>
  );
}
