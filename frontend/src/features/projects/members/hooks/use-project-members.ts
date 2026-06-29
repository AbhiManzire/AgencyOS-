import { useQuery } from '@tanstack/react-query';
import { projectMemberRecordToListItem } from '@/features/projects/members/api/member.mapper';
import { listProjectMembers } from '@/features/projects/members/api/members.api';
import { projectMembersQueryKeys } from '@/features/projects/members/hooks/project-members-query-keys';

/** TanStack Query hook for GET /projects/:id/members. */
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: projectMembersQueryKeys.list(projectId),
    queryFn: async () => {
      const result = await listProjectMembers(projectId);
      return {
        members: result.members.map(projectMemberRecordToListItem),
        availableUsers: result.availableUsers,
      };
    },
    enabled: projectId.length > 0,
  });
}
