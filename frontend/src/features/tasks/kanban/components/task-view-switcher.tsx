'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function TaskViewSwitcher() {
  const pathname = usePathname();
  const isBoard = pathname.startsWith('/tasks/board');

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      <Link
        href="/tasks"
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          !isBoard
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        List
      </Link>
      <Link
        href="/tasks/board"
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isBoard
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Board
      </Link>
    </div>
  );
}
