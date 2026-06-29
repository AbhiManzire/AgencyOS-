export const taskSubtasksQueryKeys = {
  all: (taskId: string) => ['tasks', taskId, 'subtasks'] as const,
  list: (taskId: string) => [...taskSubtasksQueryKeys.all(taskId), 'list'] as const,
};
