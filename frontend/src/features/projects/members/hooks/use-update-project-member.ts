import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProjectMember } from '@/features/projects/members/api/members.api';
import type { UpdateProjectMemberPayload } from '@/features/projects/members/api/member.types';
import { projectMembersQueryKeys } from '@/features/projects/members/hooks/project-members-query-keys';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

export function useUpdateProjectMember(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      payload,
    }: {
      memberId: string;
      payload: UpdateProjectMemberPayload;
    }) => updateProjectMember(projectId, memberId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectMembersQueryKeys.all(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(projectId) });
    },
  });
}
