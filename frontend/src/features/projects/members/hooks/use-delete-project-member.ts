import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProjectMember } from '@/features/projects/members/api/members.api';
import { projectMembersQueryKeys } from '@/features/projects/members/hooks/project-members-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useDeleteProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => deleteProjectMember(projectId, memberId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMembersQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
