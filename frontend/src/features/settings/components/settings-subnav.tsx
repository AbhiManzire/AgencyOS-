'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Can } from '@/lib/rbac';
import { SETTINGS_NAV_ITEMS } from '@/features/settings/components/settings-nav-items';

/** Horizontal sub-navigation for settings sections. */
export function SettingsSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      className="flex flex-wrap gap-2 border-b border-border pb-3"
    >
      {SETTINGS_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/settings' && pathname.startsWith(`${item.href}/`));

        const link = (
          <Link
            href={item.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {item.title}
          </Link>
        );

        if (item.permission) {
          return (
            <Can key={item.href} permission={item.permission} mode="hide">
              {link}
            </Can>
          );
        }

        return <span key={item.href}>{link}</span>;
      })}
    </nav>
  );
}
