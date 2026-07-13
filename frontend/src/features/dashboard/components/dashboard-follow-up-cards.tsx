'use client';

import { Button } from '@/components/ui/button';
import { DataCard, ErrorState, LoadingState } from '@/design-system';
import { useFollowUpDashboardSummary } from '@/features/activity/follow-ups/hooks/use-follow-ups';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

function formatCount(value: number | undefined): string {
  return String(value ?? 0);
}

export function DashboardFollowUpCards() {
  const { data: summary, isLoading, isError, error, refetch } = useFollowUpDashboardSummary();

  if (isLoading) {
    return <LoadingState label="Loading follow-up summary..." />;
  }

  if (isError || summary === undefined) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      <DataCard
        label="Today's Follow-ups"
        value={formatCount(summary.todaysFollowUps.count)}
        hint={`${String(summary.todaysFollowUps.items.length)} listed · due today`}
      />
      <DataCard
        label="Overdue"
        value={formatCount(summary.overdueFollowUps.count)}
        hint={summary.overdueFollowUps.count > 0 ? 'Needs attention' : 'No overdue follow-ups'}
      />
      <DataCard
        label="Completed Today"
        value={formatCount(summary.completedToday.count)}
        hint="Closed in the last day"
      />
      <DataCard
        label="Upcoming Meetings"
        value={formatCount(summary.upcomingMeetings.count)}
        hint="Meeting-type reminders ahead"
      />
      <DataCard
        label="Recent Activity"
        value={formatCount(summary.recentActivity.count)}
        hint="Latest timeline events"
      />
    </div>
  );
}
