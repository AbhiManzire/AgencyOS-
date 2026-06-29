import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTimeEntry } from '@/features/time-entries/api/time-entries.api';
import { invalidateTimeEntryCaches } from '@/features/time-entries/hooks/time-entries-query-keys';

export function useDeleteTimeEntry(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeEntryId: string) => deleteTimeEntry(timeEntryId),
    onSuccess: async () => {
      await invalidateTimeEntryCaches(queryClient, taskId);
    },
  });
}
