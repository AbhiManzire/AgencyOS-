import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignProjectTag,
  listProjectTags,
  unassignProjectTag,
  type AssignProjectTagPayload,
} from '@/features/projects/tags/api/project-tags.api';

export const projectTagsQueryKeys = {
  all: ['project-tags'] as const,
  byProject: (projectId: string) => [...projectTagsQueryKeys.all, projectId] as const,
};

export function useProjectTags(projectId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: projectTagsQueryKeys.byProject(projectId),
    queryFn: () => listProjectTags(projectId),
    enabled: (options?.enabled ?? true) && projectId.length > 0,
  });
}

export function useAssignProjectTag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignProjectTagPayload) => assignProjectTag(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectTagsQueryKeys.byProject(projectId) });
    },
  });
}

export function useUnassignProjectTag(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => unassignProjectTag(projectId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectTagsQueryKeys.byProject(projectId) });
    },
  });
}
