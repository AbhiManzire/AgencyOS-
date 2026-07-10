'use client';

import { Button } from '@/components/ui/button';
import { DataCard, ErrorState, LoadingState } from '@/design-system';
import type { DashboardClientStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface DashboardKpiCardsProps {
  readonly stats: DashboardClientStats;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}

export function DashboardKpiCards({
  stats,
  isLoading,
  isError,
  error,
  onRetry,
}: DashboardKpiCardsProps) {
  if (isLoading) {
    return <LoadingState label="Loading metrics..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <DataCard label="Total Clients" value={stats.totalClients} hint="All client accounts" />
      <DataCard label="Active Clients" value={stats.activeClients} hint="Currently active" />
      <DataCard label="Projects" value={stats.totalProjects} hint="Active workspace projects" />
      <DataCard label="Invoices" value={stats.totalInvoices} hint="All invoices" />
      <DataCard
        label="Outstanding Invoices"
        value={stats.outstandingInvoices}
        hint="Sent and awaiting payment"
      />
      <DataCard
        label="Archived Clients"
        value={stats.archivedClients}
        hint="Archived client accounts"
      />
    </div>
  );
}
