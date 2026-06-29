import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProjectMilestone } from '@/features/projects/milestones/api/milestones.api';
import type { CreateProjectMilestonePayload } from '@/features/projects/milestones/api/milestone.types';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useCreateProjectMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectMilestonePayload) =>
      createProjectMilestone(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMilestonesQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
