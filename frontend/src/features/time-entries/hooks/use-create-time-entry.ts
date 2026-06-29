import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateTimeEntryPayload } from '@/features/time-entries/api/time-entry.types';
import { createTimeEntry } from '@/features/time-entries/api/time-entries.api';
import { invalidateTimeEntryCaches } from '@/features/time-entries/hooks/time-entries-query-keys';

export function useCreateTimeEntry(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTimeEntryPayload) => createTimeEntry(taskId, payload),
    onSuccess: async () => {
      await invalidateTimeEntryCaches(queryClient, taskId);
    },
  });
}
