import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stopTimeEntry } from '@/features/time-entries/api/time-entries.api';
import type {
  StopTimeEntryPayload,
  TimeEntryRecord,
} from '@/features/time-entries/api/time-entry.types';
import {
  invalidateTimeEntryCaches,
  timeEntriesQueryKeys,
} from '@/features/time-entries/hooks/time-entries-query-keys';
import { clearPersistedActiveTimer } from '@/features/time-entries/utils/active-timer-storage';

interface StopTimerVariables {
  readonly timeEntryId: string;
  readonly taskId: string;
  readonly payload?: StopTimeEntryPayload;
}

interface StopTimerContext {
  readonly previousActive: TimeEntryRecord | null | undefined;
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  const activeKey = timeEntriesQueryKeys.active();

  return useMutation({
    mutationFn: ({ timeEntryId, payload = {} }: StopTimerVariables) =>
      stopTimeEntry(timeEntryId, payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: activeKey });

      const previousActive = queryClient.getQueryData<TimeEntryRecord | null>(activeKey);
      queryClient.setQueryData(activeKey, null);
      clearPersistedActiveTimer();

      return { previousActive } satisfies StopTimerContext;
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(activeKey, context?.previousActive ?? null);
    },
    onSuccess: async (_entry, variables) => {
      await invalidateTimeEntryCaches(queryClient, variables.taskId);
    },
  });
}
