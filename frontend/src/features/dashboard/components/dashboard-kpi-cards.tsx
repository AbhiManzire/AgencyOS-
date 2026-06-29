'use client';

import { DataCard, LoadingState } from '@/design-system';
import type { DashboardClientStats } from '@/features/dashboard/hooks/use-dashboard-stats';

interface DashboardKpiCardsProps {
  readonly stats: DashboardClientStats;
  readonly isLoading: boolean;
}

const PLACEHOLDER = '—';

export function DashboardKpiCards({ stats, isLoading }: DashboardKpiCardsProps) {
  if (isLoading) {
    return <LoadingState label="Loading metrics..." />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <DataCard label="Total Clients" value={stats.totalClients} hint="All client accounts" />
      <DataCard label="Active Clients" value={stats.activeClients} hint="Currently active" />
      <DataCard label="Total Contacts" value={PLACEHOLDER} hint="Aggregate contacts API pending" />
      <DataCard label="Projects" value={PLACEHOLDER} hint="Projects module coming soon" />
      <DataCard label="Revenue" value={PLACEHOLDER} hint="Finance module coming soon" />
      <DataCard
        label="Outstanding Invoices"
        value={PLACEHOLDER}
        hint="Billing module coming soon"
      />
    </div>
  );
}
