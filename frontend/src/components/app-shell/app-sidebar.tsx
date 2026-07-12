'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isAuthExplicitlyEnabled } from '@/lib/auth/config';
import { CanNavItem } from '@/lib/rbac';
import { APP_NAV_ITEMS } from './nav-config';

interface AppSidebarProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-sidebar-border',
          collapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          onClick={onNavigate}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
            A
          </span>
          {!collapsed && <span>AgencyOS</span>}
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {APP_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.activePathPrefixes !== undefined
                  ? item.activePathPrefixes.some(
                      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
                    )
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <CanNavItem key={item.href} permission={item.permission} match={item.match}>
                <Link
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-2',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </CanNavItem>
            );
          })}
        </nav>
      </ScrollArea>

      <div
        className={cn(
          'shrink-0 space-y-2 border-t border-sidebar-border p-3',
          collapsed && 'flex flex-col items-center p-2',
        )}
      >
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground"
            aria-hidden="true"
          >
            AO
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">AgencyOS</p>
              <p className="truncate text-xs text-muted-foreground">Workspace</p>
            </div>
          )}
        </div>
        {isAuthExplicitlyEnabled() ? (
          <Button
            type="button"
            variant="ghost"
            size={collapsed ? 'icon' : 'sm'}
            className={cn('w-full', !collapsed && 'justify-start')}
            title="Sign out"
            asChild
          >
            <Link href="/auth/logout">
              <LogOut className="size-4 shrink-0" />
              {!collapsed && <span>Sign out</span>}
            </Link>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
