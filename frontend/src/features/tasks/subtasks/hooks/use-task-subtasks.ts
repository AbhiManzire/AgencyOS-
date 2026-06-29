import { useQuery } from '@tanstack/react-query';
import { subtaskRecordToListItem } from '@/features/tasks/subtasks/api/subtask.mapper';
import { listSubtasks } from '@/features/tasks/subtasks/api/subtasks.api';
import { taskSubtasksQueryKeys } from '@/features/tasks/subtasks/hooks/task-subtasks-query-keys';

/** TanStack Query hook for GET /tasks/:id/subtasks. */
export function useTaskSubtasks(taskId: string) {
  return useQuery({
    queryKey: taskSubtasksQueryKeys.list(taskId),
    queryFn: async () => {
      const result = await listSubtasks(taskId);
      return result.subtasks.map(subtaskRecordToListItem);
    },
    enabled: taskId.length > 0,
  });
}
