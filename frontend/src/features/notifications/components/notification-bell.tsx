'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadNotificationCount } from '@/features/notifications/hooks/use-notifications';

/** Header bell linking to the notifications inbox with unread badge. */
export function NotificationBell() {
  const { data } = useUnreadNotificationCount();
  const count = data?.count ?? 0;

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link
        href="/settings/notifications"
        aria-label={`Notifications${count > 0 ? `, ${String(count)} unread` : ''}`}
      >
        <Bell className="size-5" />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
