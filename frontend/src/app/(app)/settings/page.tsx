'use client';

import Link from 'next/link';
import { PageHeader } from '@/design-system';
import { SETTINGS_NAV_ITEMS } from '@/features/settings/components/settings-nav-items';
import { Can } from '@/lib/rbac';

export default function SettingsLandingPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage company profile, workspace defaults, users, and roles."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SETTINGS_NAV_ITEMS.map((item) => {
          const card = (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40"
            >
              <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            </Link>
          );

          if (item.permission) {
            return (
              <Can key={item.href} permission={item.permission} mode="hide">
                {card}
              </Can>
            );
          }

          return card;
        })}
      </div>
    </>
  );
}
