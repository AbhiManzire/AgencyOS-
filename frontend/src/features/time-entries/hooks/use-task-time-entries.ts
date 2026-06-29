import { useQuery } from '@tanstack/react-query';
import { listTaskTimeEntries } from '@/features/time-entries/api/time-entries.api';
import { toTimeEntryListItem } from '@/features/time-entries/api/time-entry.mapper';
import { timeEntriesQueryKeys } from '@/features/time-entries/hooks/time-entries-query-keys';

export function useTaskTimeEntries(taskId: string) {
  return useQuery({
    queryKey: timeEntriesQueryKeys.task(taskId),
    queryFn: async () => {
      const result = await listTaskTimeEntries(taskId);
      return result.entries.map(toTimeEntryListItem);
    },
    enabled: taskId.length > 0,
  });
}
