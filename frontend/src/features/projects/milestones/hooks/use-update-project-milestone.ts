import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProjectMilestone } from '@/features/projects/milestones/api/milestones.api';
import type { UpdateProjectMilestonePayload } from '@/features/projects/milestones/api/milestone.types';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useUpdateProjectMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      payload,
    }: {
      milestoneId: string;
      payload: UpdateProjectMilestonePayload;
    }) => updateProjectMilestone(projectId, milestoneId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMilestonesQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
