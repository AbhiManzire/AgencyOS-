import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTaskDependencyPayload } from '@/features/tasks/api/task.types';
import {
  createTaskDependency,
  deleteTaskDependency,
  listTaskDependencies,
} from '@/features/tasks/api/tasks.api';
import { tasksQueryKeys } from '@/features/tasks/hooks/use-tasks';

export const taskDependenciesQueryKeys = {
  all: [...tasksQueryKeys.all, 'dependencies'] as const,
  byTask: (taskId: string) => [...taskDependenciesQueryKeys.all, taskId] as const,
};

export function useTaskDependencies(taskId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: taskDependenciesQueryKeys.byTask(taskId),
    queryFn: () => listTaskDependencies(taskId),
    enabled: (options?.enabled ?? true) && taskId.length > 0,
  });
}

export function useCreateTaskDependency(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskDependencyPayload) => createTaskDependency(taskId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskDependenciesQueryKeys.byTask(taskId) }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(taskId) }),
      ]);
    },
  });
}

export function useDeleteTaskDependency(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dependencyId: string) => deleteTaskDependency(taskId, dependencyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskDependenciesQueryKeys.byTask(taskId) }),
        queryClient.invalidateQueries({ queryKey: tasksQueryKeys.detail(taskId) }),
      ]);
    },
  });
}
