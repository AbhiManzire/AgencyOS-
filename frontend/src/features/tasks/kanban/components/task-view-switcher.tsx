'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const VIEWS = [
  { href: '/tasks', label: 'List', match: (pathname: string) => pathname === '/tasks' },
  {
    href: '/tasks/board',
    label: 'Board',
    match: (pathname: string) => pathname.startsWith('/tasks/board'),
  },
  {
    href: '/tasks/calendar',
    label: 'Calendar',
    match: (pathname: string) => pathname.startsWith('/tasks/calendar'),
  },
] as const;

export function TaskViewSwitcher() {
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      {VIEWS.map((view) => {
        const isActive = view.match(pathname);
        return (
          <Link
            key={view.href}
            href={view.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {view.label}
          </Link>
        );
      })}
    </div>
  );
}
