import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProjectTemplate,
  deleteProjectTemplate,
  updateProjectTemplate,
} from '@/features/projects/templates/api/templates.api';
import type {
  CreateProjectTemplatePayload,
  UpdateProjectTemplatePayload,
} from '@/features/projects/templates/api/template.types';
import { templatesQueryKeys } from '@/features/projects/templates/hooks/templates-query-keys';

/** Creates a project template. */
export function useCreateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectTemplatePayload) => createProjectTemplate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templatesQueryKeys.all });
    },
  });
}

/** Updates a project template. */
export function useUpdateProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProjectTemplatePayload }) =>
      updateProjectTemplate(id, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: templatesQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: templatesQueryKeys.detail(variables.id) }),
      ]);
    },
  });
}

/** Deletes a project template. */
export function useDeleteProjectTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProjectTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: templatesQueryKeys.all });
    },
  });
}
