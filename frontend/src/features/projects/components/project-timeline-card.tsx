'use client';

import { Card, CardContent, CardHeader } from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ActivityTimeline } from '@/features/activity/components/activity-timeline';

interface ProjectTimelineCardProps {
  readonly projectId: string;
}

export function ProjectTimelineCard({ projectId }: ProjectTimelineCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTimeline
          entityType="project"
          entityId={projectId}
          emptyTitle="No timeline activity"
          emptyDescription="Project events such as updates, status changes, and member changes will appear here."
        />
      </CardContent>
    </Card>
  );
}
