'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ProjectProgressMetrics } from '@/features/projects/components/project-detail-progress-card';
import { useProjectMilestones } from '@/features/projects/milestones/hooks/use-project-milestones';
import { listTasks } from '@/features/tasks/api/tasks.api';

interface UseProjectProgressResult {
  readonly metrics: ProjectProgressMetrics | undefined;
  readonly isLoading: boolean;
}

/** Derives project progress from milestones and task list totals. */
export function useProjectProgress(projectId: string): UseProjectProgressResult {
  const milestonesQuery = useProjectMilestones(projectId);
  const [tasksTotalQuery, tasksDoneQuery] = useQueries({
    queries: [
      {
        queryKey: ['projects', projectId, 'progress', 'tasks', 'total'],
        queryFn: () => listTasks({ projectId, take: 1 }),
        enabled: projectId.length > 0,
      },
      {
        queryKey: ['projects', projectId, 'progress', 'tasks', 'done'],
        queryFn: () => listTasks({ projectId, status: 'DONE', take: 1 }),
        enabled: projectId.length > 0,
      },
    ],
  });

  const metrics = useMemo((): ProjectProgressMetrics | undefined => {
    if (!milestonesQuery.data) {
      return undefined;
    }

    const milestones = milestonesQuery.data.milestones;
    const milestonesTotal = milestones.length;
    const milestonesCompleted = milestones.filter(
      (milestone) => milestone.status === 'COMPLETED',
    ).length;
    const completionPercent =
      milestonesTotal === 0
        ? 0
        : Math.round(
            milestones.reduce((sum, milestone) => sum + milestone.progressPercent, 0) /
              milestonesTotal,
          );

    return {
      milestonesTotal,
      milestonesCompleted,
      tasksTotal: tasksTotalQuery.data?.total ?? 0,
      tasksDone: tasksDoneQuery.data?.total ?? 0,
      completionPercent,
    };
  }, [milestonesQuery.data, tasksDoneQuery.data?.total, tasksTotalQuery.data?.total]);

  return {
    metrics,
    isLoading: milestonesQuery.isLoading || tasksTotalQuery.isLoading || tasksDoneQuery.isLoading,
  };
}
