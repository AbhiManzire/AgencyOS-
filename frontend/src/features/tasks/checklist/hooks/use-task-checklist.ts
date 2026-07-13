import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTaskChecklistItem,
  deleteTaskChecklistItem,
  listTaskChecklist,
  updateTaskChecklistItem,
} from '@/features/tasks/checklist/api/checklist.api';
import type {
  CreateTaskChecklistItemPayload,
  UpdateTaskChecklistItemPayload,
} from '@/features/tasks/checklist/api/checklist.types';

export const checklistQueryKeys = {
  all: ['task-checklist'] as const,
  list: (taskId: string) => [...checklistQueryKeys.all, taskId] as const,
};

/** Lists checklist items for a task. */
export function useTaskChecklist(taskId: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: checklistQueryKeys.list(taskId),
    queryFn: () => listTaskChecklist(taskId),
    enabled: (options?.enabled ?? true) && taskId.length > 0,
  });
}

/** Creates a checklist item. */
export function useCreateTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskChecklistItemPayload) =>
      createTaskChecklistItem(taskId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(taskId) });
    },
  });
}

/** Updates a checklist item. */
export function useUpdateTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateTaskChecklistItemPayload;
    }) => updateTaskChecklistItem(taskId, itemId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(taskId) });
    },
  });
}

/** Deletes a checklist item. */
export function useDeleteTaskChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteTaskChecklistItem(taskId, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: checklistQueryKeys.list(taskId) });
    },
  });
}
