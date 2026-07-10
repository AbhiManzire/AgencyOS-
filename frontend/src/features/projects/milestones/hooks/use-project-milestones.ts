import { useQuery } from '@tanstack/react-query';
import { projectMilestoneRecordToListItem } from '@/features/projects/milestones/api/milestone.mapper';
import { listProjectMilestones } from '@/features/projects/milestones/api/milestones.api';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';

/** TanStack Query hook for GET /projects/:id/milestones. */
export function useProjectMilestones(projectId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: projectMilestonesQueryKeys.list(projectId),
    queryFn: async () => {
      const result = await listProjectMilestones(projectId);
      return {
        milestones: result.milestones.map(projectMilestoneRecordToListItem),
        availableOwners: result.availableOwners,
      };
    },
    enabled: (options?.enabled ?? true) && projectId.length > 0,
  });
}
