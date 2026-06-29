import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProject } from '@/features/projects/api/projects.api';
import type { CreateProjectPayload } from '@/features/projects/api/project.types';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

/** TanStack Query mutation hook for POST /projects. */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
    },
  });
}
