'use client';

import { FolderOpen } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  ErrorState,
  LoadingState,
  PageContainer,
} from '@/design-system';
import { CardTitle } from '@/design-system/typography';
import { ActivityTimeline } from '@/features/activity';
import { ClientDetailSectionPlaceholder } from '@/features/clients/components/client-detail-section-placeholder';
import { useClient } from '@/features/clients/hooks/use-client';
import { CreateProjectDrawer } from '@/features/projects/components/create-project-drawer';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailOverviewCard } from '@/features/projects/components/project-detail-overview-card';
import { ProjectDetailProgressCard } from '@/features/projects/components/project-detail-progress-card';
import { ProjectDetailTabs } from '@/features/projects/components/project-detail-tabs';
import { ProjectNotFoundState } from '@/features/projects/components/project-not-found-state';
import { ProjectMembersTab } from '@/features/projects/members/components/project-members-tab';
import { ProjectMilestonesTab } from '@/features/projects/milestones/components/project-milestones-tab';
import { useProject } from '@/features/projects/hooks/use-project';
import { displayProjectField } from '@/features/projects/utils/project-display';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const { data: client } = useClient(project?.clientId ?? '', {
    enabled: project !== undefined,
  });

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading project..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <ProjectNotFoundState />;
    }

    return (
      <PageContainer size="lg">
        <ErrorState
          message={extractApiErrorMessage(error)}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!project) {
    return <ProjectNotFoundState />;
  }

  const clientName = client?.displayName ?? displayProjectField(project.clientId);

  return (
    <PageContainer size="lg">
      <ProjectDetailHeader
        project={project}
        clientName={clientName}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <CreateProjectDrawer
        open={editDrawerOpen}
        mode="edit"
        projectId={projectId}
        onOpenChange={setEditDrawerOpen}
      />

      <div className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectDetailOverviewCard project={project} />
          <ProjectDetailProgressCard />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline entityType="project" entityId={projectId} />
          </CardContent>
        </Card>

        <ProjectDetailTabs
          members={<ProjectMembersTab projectId={projectId} />}
          milestones={<ProjectMilestonesTab projectId={projectId} />}
          files={
            <ClientDetailSectionPlaceholder
              title="Files"
              description="Project files and deliverables will appear here."
              icon={FolderOpen}
            />
          }
        />
      </div>
    </PageContainer>
  );
}
