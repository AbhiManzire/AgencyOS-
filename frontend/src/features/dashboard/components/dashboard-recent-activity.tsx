'use client';

import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/design-system';
import { ActivityTimeline } from '@/features/activity';
import { useRecentActivities } from '@/features/activity/hooks/use-activities';
import { DashboardSection } from '@/features/dashboard/components/dashboard-section';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export function DashboardRecentActivity() {
  const { data: entries = [], isLoading, error, refetch } = useRecentActivities(10);

  return (
    <DashboardSection
      title="Recent Activity"
      description="Latest workspace events across clients and contacts."
    >
      {error ? (
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <LoadingState label="Loading recent activity..." />
      ) : (
        <ActivityTimeline entityType="workspace" entityId="dashboard" entries={entries} />
      )}
    </DashboardSection>
  );
}
