import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateTimeEntryPayload } from '@/features/time-entries/api/time-entry.types';
import { updateTimeEntry } from '@/features/time-entries/api/time-entries.api';
import { invalidateTimeEntryCaches } from '@/features/time-entries/hooks/time-entries-query-keys';

export function useUpdateTimeEntry(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      timeEntryId,
      payload,
    }: {
      readonly timeEntryId: string;
      readonly payload: UpdateTimeEntryPayload;
    }) => updateTimeEntry(timeEntryId, payload),
    onSuccess: async () => {
      await invalidateTimeEntryCaches(queryClient, taskId);
    },
  });
}
