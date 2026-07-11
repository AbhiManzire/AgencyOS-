'use client';

import { useMemo } from 'react';
import { useProjectMilestones } from '@/features/projects/milestones/hooks/use-project-milestones';

export interface ProjectProgressMetrics {
  readonly milestonesTotal: number;
  readonly milestonesCompleted: number;
  readonly completionPercent: number | null;
}

interface UseProjectProgressResult {
  readonly metrics: ProjectProgressMetrics | undefined;
  readonly isLoading: boolean;
}

/** Derives project completion from live milestone progress. */
export function useProjectProgress(projectId: string): UseProjectProgressResult {
  const milestonesQuery = useProjectMilestones(projectId);

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
        ? null
        : Math.round(
            milestones.reduce((sum, milestone) => sum + milestone.progressPercent, 0) /
              milestonesTotal,
          );

    return {
      milestonesTotal,
      milestonesCompleted,
      completionPercent,
    };
  }, [milestonesQuery.data]);

  return {
    metrics,
    isLoading: milestonesQuery.isLoading,
  };
}
