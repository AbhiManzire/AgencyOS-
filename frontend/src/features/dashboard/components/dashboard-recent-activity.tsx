'use client';

import { ActivityTimeline } from '@/features/activity';
import { DashboardSection } from '@/features/dashboard/components/dashboard-section';
import { getDashboardRecentActivities } from '@/features/dashboard/mock/dashboard-activity.mock';

export function DashboardRecentActivity() {
  const entries = getDashboardRecentActivities(10);

  return (
    <DashboardSection
      title="Recent Activity"
      description="Latest workspace events across clients and contacts."
    >
      <ActivityTimeline entityType="workspace" entityId="dashboard" entries={entries} />
    </DashboardSection>
  );
}
