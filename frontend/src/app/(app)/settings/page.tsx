'use client';

import Link from 'next/link';
import { DataCard, LoadingState, PageHeader } from '@/design-system';
import { SETTINGS_NAV_ITEMS } from '@/features/settings/components/settings-nav-items';
import { useAdminSummary } from '@/features/settings/hooks/use-settings';
import { Can } from '@/lib/rbac';

export default function SettingsLandingPage() {
  const adminSummary = useAdminSummary();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage company profile, workspace defaults, users, security, and system options."
      />

      <Can permission={['settings.read', 'admin.system']} match="any" mode="hide">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {adminSummary.isLoading ? (
            <div className="col-span-full">
              <LoadingState label="Loading admin summary..." />
            </div>
          ) : adminSummary.data ? (
            <>
              <DataCard label="Active Users" value={adminSummary.data.activeUsers} />
              <DataCard label="Workspaces" value={adminSummary.data.workspaceCount} />
              <DataCard label="Pending Invites" value={adminSummary.data.pendingInvites} />
              <DataCard
                label="Unread Notifications"
                value={adminSummary.data.unreadNotifications}
              />
              <DataCard label="Audit Events (24h)" value={adminSummary.data.auditEventsLast24h} />
            </>
          ) : null}
        </div>
      </Can>

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
