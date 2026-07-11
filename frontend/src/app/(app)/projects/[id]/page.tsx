'use client';

import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState, PageContainer, useToast } from '@/design-system';
import { useClient } from '@/features/clients/hooks/use-client';
import { ArchiveProjectDialog } from '@/features/projects/components/archive-project-dialog';
import { CreateProjectDrawer } from '@/features/projects/components/create-project-drawer';
import { ProjectComingSoonTab } from '@/features/projects/components/project-coming-soon-tab';
import { ProjectInvoicesTab } from '@/features/projects/components/project-invoices-tab';
import { ProjectPaymentsTab } from '@/features/projects/components/project-payments-tab';
import { ProjectTasksTab } from '@/features/projects/components/project-tasks-tab';
import { ProjectDetailHeader } from '@/features/projects/components/project-detail-header';
import { ProjectDetailOverviewCard } from '@/features/projects/components/project-detail-overview-card';
import {
  ProjectDetailTabs,
  type ProjectDetailTab,
} from '@/features/projects/components/project-detail-tabs';
import { ProjectHealthCard } from '@/features/projects/components/project-health-card';
import { ProjectMembersSummaryCard } from '@/features/projects/components/project-members-summary-card';
import { ProjectNotFoundState } from '@/features/projects/components/project-not-found-state';
import { ProjectTimelineCard } from '@/features/projects/components/project-timeline-card';
import { useArchiveProject } from '@/features/projects/hooks/use-archive-project';
import { useCompleteProject } from '@/features/projects/hooks/use-complete-project';
import { useMarkProjectInvoiceReady } from '@/features/projects/hooks/use-mark-project-invoice-ready';
import { useProject } from '@/features/projects/hooks/use-project';
import { useRestoreProject } from '@/features/projects/hooks/use-restore-project';
import { displayProjectField } from '@/features/projects/utils/project-display';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

const ActivityTimeline = dynamic(
  () =>
    import('@/features/activity/components/activity-timeline').then((mod) => ({
      default: mod.ActivityTimeline,
    })),
  { loading: () => <LoadingState label="Loading activity..." /> },
);

const ProjectMembersTab = dynamic(
  () =>
    import('@/features/projects/members/components/project-members-tab').then((mod) => ({
      default: mod.ProjectMembersTab,
    })),
  { loading: () => <LoadingState label="Loading members..." /> },
);

export default function ProjectDetailPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('overview');

  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const { data: client } = useClient(project?.clientId ?? '', {
    enabled: project !== undefined,
  });
  const { mutateAsync: completeProject, isPending: isCompleting } = useCompleteProject();
  const { mutateAsync: markInvoiceReady, isPending: isMarkingInvoiceReady } =
    useMarkProjectInvoiceReady();
  const { mutateAsync: archiveProject, isPending: isArchiving } = useArchiveProject();
  const { mutateAsync: restoreProject, isPending: isRestoring } = useRestoreProject();

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

  const handleComplete = async (): Promise<void> => {
    try {
      await completeProject(projectId);
      showToast('Project marked complete');
      await refetch();
    } catch (completeError) {
      showToast(extractApiErrorMessage(completeError), 'error');
    }
  };

  const handleInvoiceReady = async (): Promise<void> => {
    try {
      await markInvoiceReady(projectId);
      showToast('Project marked invoice ready');
      await refetch();
    } catch (invoiceReadyError) {
      showToast(extractApiErrorMessage(invoiceReadyError), 'error');
    }
  };

  const handleConfirmArchive = async (): Promise<void> => {
    try {
      await archiveProject(projectId);
      showToast('Project archived successfully');
      setArchiveDialogOpen(false);
      router.push('/projects');
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (): Promise<void> => {
    try {
      await restoreProject(projectId);
      showToast('Project restored successfully');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="lg">
      <ProjectDetailHeader
        project={project}
        clientName={clientName}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
        onComplete={() => {
          void handleComplete();
        }}
        onInvoiceReady={() => {
          void handleInvoiceReady();
        }}
        onArchive={() => {
          setArchiveDialogOpen(true);
        }}
        onRestore={() => {
          void handleRestore();
        }}
        isCompletePending={isCompleting}
        isInvoiceReadyPending={isMarkingInvoiceReady}
        isRestorePending={isRestoring}
      />

      <CreateProjectDrawer
        open={editDrawerOpen}
        mode="edit"
        projectId={projectId}
        onOpenChange={setEditDrawerOpen}
      />

      <ArchiveProjectDialog
        open={archiveDialogOpen}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveDialogOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
      />

      <div className="mt-6">
        <ProjectDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          overview={
            <div className="space-y-6">
              <ProjectHealthCard project={project} />
              <div className="grid gap-6 lg:grid-cols-2">
                <ProjectDetailOverviewCard project={project} clientName={clientName} />
                <div className="space-y-6">
                  <ProjectMembersSummaryCard
                    projectId={projectId}
                    onViewAll={() => {
                      setActiveTab('members');
                    }}
                  />
                  <ProjectTimelineCard projectId={projectId} />
                </div>
              </div>
            </div>
          }
          members={
            <ProjectMembersTab
              projectId={projectId}
              projectOwnerUserId={project.projectManagerUserId}
            />
          }
          tasks={<ProjectTasksTab projectId={projectId} />}
          finance={
            <div className="space-y-8">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Invoices</h3>
                <ProjectInvoicesTab projectId={projectId} />
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Payments</h3>
                <ProjectPaymentsTab projectId={projectId} />
              </div>
            </div>
          }
          notes={
            <ProjectComingSoonTab
              title="Notes coming soon"
              description="Project notes will be available in a later sprint."
            />
          }
          documents={
            <ProjectComingSoonTab
              title="Documents coming soon"
              description="Project documents will be available in a later sprint."
            />
          }
          activity={<ActivityTimeline entityType="project" entityId={projectId} />}
        />
      </div>
    </PageContainer>
  );
}
