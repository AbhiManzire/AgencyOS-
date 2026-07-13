'use client';

import { Button } from '@/components/ui/button';
import { DataCard, ErrorState, LoadingState } from '@/design-system';
import type { WorkspaceDashboardResult } from '@/features/sales/workspace/api/workspace.types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface WorkspaceDashboardCardsProps {
  readonly dashboard: WorkspaceDashboardResult | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly onRetry: () => void;
}

/** Top-row count cards for the sales My Work dashboard. */
export function WorkspaceDashboardCards({
  dashboard,
  isLoading,
  isError,
  error,
  onRetry,
}: WorkspaceDashboardCardsProps) {
  if (isLoading) {
    return <LoadingState label="Loading workspace..." />;
  }

  if (isError || dashboard === undefined) {
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <DataCard label="Today's Tasks" value={dashboard.todaysTasks.count} hint="Due today" />
      <DataCard label="Today's Calls" value={dashboard.todaysCalls.count} hint="Calls due today" />
      <DataCard
        label="Today's Meetings"
        value={dashboard.todaysMeetings.count}
        hint="Meetings due today"
      />
      <DataCard
        label="Today's Follow-ups"
        value={dashboard.todaysFollowUps.count}
        hint="Follow-ups scheduled today"
      />
      <DataCard label="Overdue" value={dashboard.overdue.count} hint="Past-due tasks" />
      <DataCard
        label="Assigned Leads"
        value={dashboard.assignedLeads.count}
        hint="Your open leads"
      />
      <DataCard
        label="Assigned Deals"
        value={dashboard.assignedDeals.count}
        hint="Your open deals"
      />
      <DataCard
        label="Closing This Week"
        value={dashboard.dealsClosingThisWeek.count}
        hint="Expected close within 7 days"
      />
      <DataCard
        label="Upcoming Reminders"
        value={dashboard.upcomingReminders.count}
        hint="Reminders coming up"
      />
      <DataCard
        label="Unread Notifications"
        value={dashboard.unreadNotifications}
        hint="Sales notifications"
      />
    </div>
  );
}
