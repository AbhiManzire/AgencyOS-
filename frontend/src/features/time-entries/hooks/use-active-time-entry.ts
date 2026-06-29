import { useQuery } from '@tanstack/react-query';
import { getActiveTimeEntry } from '@/features/time-entries/api/time-entries.api';
import type { TimeEntryRecord } from '@/features/time-entries/api/time-entry.types';
import { timeEntriesQueryKeys } from '@/features/time-entries/hooks/time-entries-query-keys';
import {
  clearPersistedActiveTimer,
  writePersistedActiveTimer,
} from '@/features/time-entries/utils/active-timer-storage';

export function useActiveTimeEntry() {
  return useQuery<TimeEntryRecord | null>({
    queryKey: timeEntriesQueryKeys.active(),
    queryFn: async () => {
      const entry = await getActiveTimeEntry();

      if (entry?.isRunning === true) {
        writePersistedActiveTimer({
          timeEntryId: entry.id,
          taskId: entry.taskId,
          startTime: entry.startTime,
        });
      } else {
        clearPersistedActiveTimer();
      }

      return entry;
    },
    staleTime: 0,
  });
}
