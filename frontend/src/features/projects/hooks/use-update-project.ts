import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '@/features/projects/api/projects.api';
import type { UpdateProjectPayload } from '@/features/projects/api/project.types';
import { projectsQueryKeys } from '@/features/projects/hooks/use-projects';

interface UpdateProjectVariables {
  readonly id: string;
  readonly payload: UpdateProjectPayload;
}

/** TanStack Query mutation hook for PATCH /projects/:id. */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateProjectVariables) => updateProject(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}
