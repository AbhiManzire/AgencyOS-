import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AssignTaskTagPayload } from '@/features/tasks/api/task.types';
import { assignTaskTag, listTaskTags, unassignTaskTag } from '@/features/tasks/api/tasks.api';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export const taskTagsQueryKeys = {
  all: [...tasksQueryKeys.all, 'tags'] as const,
  byTask: (taskId: string) => [...taskTagsQueryKeys.all, taskId] as const,
};

export function useTaskTags(taskId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: taskTagsQueryKeys.byTask(taskId),
    queryFn: () => listTaskTags(taskId),
    enabled: (options?.enabled ?? true) && taskId.length > 0,
  });
}

export function useAssignTaskTag(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignTaskTagPayload) => assignTaskTag(taskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskTagsQueryKeys.byTask(taskId) });
    },
  });
}

export function useUnassignTaskTag(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => unassignTaskTag(taskId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskTagsQueryKeys.byTask(taskId) });
    },
  });
}
