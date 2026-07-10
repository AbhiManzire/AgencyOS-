'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
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
import { useProject } from '@/features/projects/hooks/use-project';
import { useProjectMilestones } from '@/features/projects/milestones/hooks/use-project-milestones';
import { displayProjectField } from '@/features/projects/utils/project-display';
import { TaskDetailHeader } from '@/features/tasks/components/task-detail-header';
import { TaskFormDrawer } from '@/features/tasks/components/task-form-drawer';
import { TaskDetailOverviewCard } from '@/features/tasks/components/task-detail-overview-card';
import { TaskDetailProgressCard } from '@/features/tasks/components/task-detail-progress-card';
import { TaskDetailTabs } from '@/features/tasks/components/task-detail-tabs';
import { TaskNotFoundState } from '@/features/tasks/components/task-not-found-state';
import { useTask } from '@/features/tasks/hooks/use-task';
import { displayTaskField } from '@/features/tasks/utils/task-display';
import { extractApiErrorMessage, isApiNotFoundError } from '@/lib/api/extract-api-error';

const ActivityTimeline = dynamic(
  () =>
    import('@/features/activity/components/activity-timeline').then((mod) => ({
      default: mod.ActivityTimeline,
    })),
  { loading: () => <LoadingState label="Loading activity..." /> },
);

const TaskSubtasksTab = dynamic(
  () =>
    import('@/features/tasks/subtasks/components/task-subtasks-tab').then((mod) => ({
      default: mod.TaskSubtasksTab,
    })),
  { loading: () => <LoadingState label="Loading subtasks..." /> },
);

const FilePanel = dynamic(
  () =>
    import('@/features/files/components/file-panel').then((mod) => ({
      default: mod.FilePanel,
    })),
  { loading: () => <LoadingState label="Loading files..." /> },
);

const CommentsPanel = dynamic(
  () =>
    import('@/features/comments/components/comments-panel').then((mod) => ({
      default: mod.CommentsPanel,
    })),
  { loading: () => <LoadingState label="Loading comments..." /> },
);

const TaskTimeEntriesTab = dynamic(
  () =>
    import('@/features/time-entries/components/task-time-entries-tab').then((mod) => ({
      default: mod.TaskTimeEntriesTab,
    })),
  { loading: () => <LoadingState label="Loading time entries..." /> },
);

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = params.id;
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const { data: task, isLoading, error, refetch } = useTask(taskId);
  const { data: project } = useProject(task?.projectId ?? '', {
    enabled: task !== undefined,
  });
  const projectId = task?.projectId;
  const { data: milestonesData } = useProjectMilestones(projectId ?? '', {
    enabled: Boolean(task?.milestoneId),
  });

  const projectName = project?.name ?? displayProjectField(task?.projectId);
  const milestoneName = useMemo(() => {
    if (!task?.milestoneId) {
      return '—';
    }

    const milestone = milestonesData?.milestones.find((item) => item.id === task.milestoneId);
    return milestone?.name ?? displayTaskField(task.milestoneId);
  }, [milestonesData?.milestones, task]);

  if (isLoading) {
    return (
      <PageContainer size="lg">
        <LoadingState label="Loading task..." />
      </PageContainer>
    );
  }

  if (error) {
    if (isApiNotFoundError(error)) {
      return <TaskNotFoundState />;
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

  if (!task) {
    return <TaskNotFoundState />;
  }

  return (
    <PageContainer size="lg">
      <TaskDetailHeader
        task={task}
        onEdit={() => {
          setEditDrawerOpen(true);
        }}
      />

      <TaskFormDrawer
        open={editDrawerOpen}
        mode="edit"
        task={task}
        onOpenChange={setEditDrawerOpen}
      />

      <div className="mt-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <TaskDetailOverviewCard
            description={task.description}
            projectId={task.projectId}
            projectName={projectName}
            milestoneName={milestoneName}
            startDate={task.startDate}
            dueDate={task.dueDate}
            estimatedHours={task.estimatedHours}
            createdByUserId={task.createdByUserId}
            createdByDisplayName={task.createdByDisplayName}
          />
          <TaskDetailProgressCard
            taskId={taskId}
            status={task.status}
            subtaskCount={task.subtaskCount}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline entityType="task" entityId={taskId} />
          </CardContent>
        </Card>

        <TaskDetailTabs
          subtasks={<TaskSubtasksTab taskId={taskId} projectId={task.projectId} />}
          files={<FilePanel entityType="task" entityId={taskId} />}
          comments={<CommentsPanel entityType="task" entityId={taskId} />}
          timeEntries={<TaskTimeEntriesTab taskId={taskId} projectId={task.projectId} />}
        />
      </div>
    </PageContainer>
  );
}
