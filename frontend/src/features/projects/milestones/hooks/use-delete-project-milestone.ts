import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProjectMilestone } from '@/features/projects/milestones/api/milestones.api';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useDeleteProjectMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => deleteProjectMilestone(projectId, milestoneId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMilestonesQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
