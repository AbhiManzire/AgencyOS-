import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProjectMember } from '@/features/projects/members/api/members.api';
import type { CreateProjectMemberPayload } from '@/features/projects/members/api/member.types';
import { projectMembersQueryKeys } from '@/features/projects/members/hooks/project-members-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useCreateProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectMemberPayload) => createProjectMember(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMembersQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
