'use client';

import { Button } from '@/components/ui/button';
import { DataCard, ErrorState, LoadingState } from '@/design-system';
import type { DashboardSummary } from '@/features/dashboard/api/dashboard.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatMoney } from '@/lib/format/money';

interface DashboardKpiCardsProps {
  readonly summary: DashboardSummary | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}

export function DashboardKpiCards({
  summary,
  isLoading,
  isError,
  error,
  onRetry,
}: DashboardKpiCardsProps) {
  if (isLoading) {
    return <LoadingState label="Loading metrics..." />;
  }

  if (isError || summary === undefined) {
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

  const { currency } = summary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <DataCard
        label="Invoiced Monthly"
        value={formatMoney(summary.revenue.invoicedMonthly, currency, 0)}
        hint="Issued this month"
      />
      <DataCard
        label="Collected Monthly"
        value={formatMoney(summary.revenue.collectedMonthly, currency, 0)}
        hint="Paid this month"
      />
      <DataCard
        label="Outstanding Amount"
        value={formatMoney(summary.invoices.outstandingAmount, currency, 0)}
        hint="Sent and overdue"
      />
      <DataCard label="Total Clients" value={summary.clients.total} hint="All client accounts" />
      <DataCard label="Active Clients" value={summary.clients.active} hint="Currently active" />
      <DataCard
        label="Active Projects"
        value={summary.projects.active}
        hint="Projects in delivery"
      />
      <DataCard
        label="Tasks Due Today"
        value={summary.tasks.dueToday}
        hint="Open tasks due today"
      />
      <DataCard label="Overdue Tasks" value={summary.tasks.overdue} hint="Past due and open" />
      <DataCard label="Open Deals" value={summary.sales.openDeals} hint="Active pipeline deals" />
    </div>
  );
}
