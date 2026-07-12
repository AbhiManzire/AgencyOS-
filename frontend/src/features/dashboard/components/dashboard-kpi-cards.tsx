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

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      <DataCard
        label="Revenue"
        value={formatMoney(summary.revenue.invoicedMonthly, currency, 0)}
        hint="Invoiced this month"
      />
      <DataCard
        label="MRR"
        value={formatMoney(summary.finance.mrr, currency, 0)}
        hint="Monthly recurring revenue"
      />
      <DataCard
        label="ARR"
        value={formatMoney(summary.finance.arr, currency, 0)}
        hint="Annual recurring revenue"
      />
      <DataCard
        label="Collections"
        value={formatMoney(summary.finance.collections, currency, 0)}
        hint="Payments received this month"
      />
      <DataCard
        label="Outstanding"
        value={formatMoney(summary.invoices.outstandingAmount, currency, 0)}
        hint="Sent and overdue"
      />
      <DataCard
        label="Expenses"
        value={formatMoney(summary.finance.expensesMonthly, currency, 0)}
        hint="Expenses this month"
      />
      <DataCard
        label="Net Profit"
        value={formatMoney(summary.finance.netProfit, currency, 0)}
        hint="Collections minus expenses"
      />
      <DataCard
        label="Gross Margin"
        value={formatPercent(summary.finance.grossMargin)}
        hint="(Revenue − expenses) / revenue"
      />
      <DataCard
        label="Cash Balance"
        value={formatMoney(summary.finance.cashBalance, currency, 0)}
        hint="Collections less expenses"
      />
      <DataCard
        label="Pipeline Value"
        value={formatMoney(summary.sales.pipelineValue, currency, 0)}
        hint="Open deal value"
      />
      <DataCard
        label="Expected Revenue"
        value={formatMoney(summary.sales.expectedRevenue, currency, 0)}
        hint="Weighted by probability"
      />
      <DataCard label="Active Clients" value={summary.clients.active} hint="Currently active" />
      <DataCard
        label="New Clients"
        value={summary.clients.newClients}
        hint="Became clients this month"
      />
      <DataCard
        label="Lost Clients"
        value={summary.clients.lostClients}
        hint="Inactive or archived this month"
      />
      <DataCard
        label="Retention"
        value={formatPercent(summary.clients.retentionRate)}
        hint="Active / (active + lost)"
      />
      <DataCard
        label="Active Projects"
        value={summary.projects.active}
        hint="Projects in delivery"
      />
      <DataCard
        label="Projects At Risk"
        value={summary.projects.atRisk}
        hint="Past target end date"
      />
      <DataCard
        label="Completed Projects"
        value={summary.projects.completed}
        hint="Total completed"
      />
      <DataCard label="Open Tasks" value={summary.tasks.openTotal} hint="All open parent tasks" />
      <DataCard label="Overdue Tasks" value={summary.tasks.overdue} hint="Past due and open" />
      <DataCard
        label="Team Utilization"
        value={formatPercent(summary.teamUtilization)}
        hint="Logged hours vs capacity"
      />
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
      <DataCard label="Total Projects" value={summary.projects.total} hint="All non-archived" />
      <DataCard
        label="Planning Projects"
        value={summary.projects.planning}
        hint="Not yet started"
      />
      <DataCard
        label="On Hold Projects"
        value={summary.projects.onHold}
        hint="Temporarily paused"
      />
      <DataCard
        label="Cancelled Projects"
        value={summary.projects.cancelled}
        hint="Cancelled engagements"
      />
      <DataCard label="Ending Soon" value={summary.projects.endingSoon} hint="Due within 7 days" />
      <DataCard
        label="Over Budget"
        value={summary.projects.overBudget}
        hint="Invoiced over budget"
      />
      <DataCard
        label="Tasks Due Today"
        value={summary.tasks.dueToday}
        hint="Open tasks due today"
      />
      <DataCard
        label="My Open Tasks"
        value={summary.tasks.myTasks.openTotal}
        hint="Assigned to you"
      />
      <DataCard
        label="My Completed"
        value={summary.tasks.myTasks.completed}
        hint="Completed assignments"
      />
      <DataCard
        label="My Blocked"
        value={summary.tasks.myTasks.blocked}
        hint="Blocked assignments"
      />
      <DataCard
        label="My Due Today"
        value={summary.tasks.myTasks.dueToday}
        hint="Your tasks due today"
      />
      <DataCard
        label="My Overdue"
        value={summary.tasks.myTasks.overdue}
        hint="Your overdue tasks"
      />
      <DataCard
        label="My Due This Week"
        value={summary.tasks.myTasks.dueThisWeek}
        hint="Due within this week"
      />
      <DataCard label="Open Deals" value={summary.sales.openDeals} hint="Active pipeline deals" />
      <DataCard label="Leads" value={summary.sales.leadCount} hint="All non-archived leads" />
      <DataCard
        label="Qualified Leads"
        value={summary.sales.qualifiedLeads}
        hint="Ready for pipeline"
      />
      <DataCard
        label="Won Revenue"
        value={formatMoney(summary.sales.wonRevenue, currency, 0)}
        hint="Closed-won value"
      />
      <DataCard
        label="Lost Revenue"
        value={formatMoney(summary.sales.lostRevenue, currency, 0)}
        hint="Closed-lost value"
      />
      <DataCard
        label="Conversion Rate"
        value={formatPercent(summary.sales.conversionRate)}
        hint="Won / (won + lost)"
      />
      <DataCard
        label="Avg Deal Size"
        value={formatMoney(summary.sales.averageDealSize, currency, 0)}
        hint="Across all deals"
      />
      <DataCard
        label="Monthly Profit"
        value={formatMoney(summary.finance.profitMonthly, currency, 0)}
        hint="Collections minus expenses"
      />
      <DataCard
        label="Overdue Amount"
        value={formatMoney(summary.finance.overdueAmount, currency, 0)}
        hint="Past-due invoices"
      />
      <DataCard
        label="Monthly Collections"
        value={formatMoney(summary.finance.monthlyCollections, currency, 0)}
        hint="Payments received"
      />
      <DataCard
        label="AP Expenses"
        value={formatMoney(summary.finance.monthlyExpenses, currency, 0)}
        hint="Expense outflows"
      />
    </div>
  );
}
