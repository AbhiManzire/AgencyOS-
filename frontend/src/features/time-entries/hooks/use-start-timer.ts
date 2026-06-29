import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startTimeEntry } from '@/features/time-entries/api/time-entries.api';
import type {
  StartTimeEntryPayload,
  TimeEntryRecord,
} from '@/features/time-entries/api/time-entry.types';
import {
  invalidateTimeEntryCaches,
  timeEntriesQueryKeys,
} from '@/features/time-entries/hooks/time-entries-query-keys';
import { writePersistedActiveTimer } from '@/features/time-entries/utils/active-timer-storage';

interface StartTimerContext {
  readonly previousActive: TimeEntryRecord | null | undefined;
}

export function useStartTimer(taskId: string) {
  const queryClient = useQueryClient();
  const activeKey = timeEntriesQueryKeys.active();

  return useMutation({
    mutationFn: (payload: StartTimeEntryPayload = {}) => startTimeEntry(taskId, payload),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: activeKey });

      const previousActive = queryClient.getQueryData<TimeEntryRecord | null>(activeKey);
      const now = new Date().toISOString();

      const optimistic: TimeEntryRecord = {
        id: 'optimistic-timer',
        tenantId: '',
        workspaceId: '',
        taskId,
        userId: '',
        userDisplayName: null,
        userEmail: null,
        startTime: now,
        endTime: null,
        durationMinutes: null,
        isRunning: true,
        billable: true,
        notes: null,
        createdAt: now,
        updatedAt: now,
        createdByUserId: null,
        updatedByUserId: null,
        deletedAt: null,
        deletedByUserId: null,
      };

      queryClient.setQueryData(activeKey, optimistic);
      writePersistedActiveTimer({
        timeEntryId: optimistic.id,
        taskId,
        startTime: now,
      });

      return { previousActive } satisfies StartTimerContext;
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(activeKey, context?.previousActive ?? null);
    },
    onSuccess: async (entry) => {
      queryClient.setQueryData(activeKey, entry);
      writePersistedActiveTimer({
        timeEntryId: entry.id,
        taskId: entry.taskId,
        startTime: entry.startTime,
      });
      await invalidateTimeEntryCaches(queryClient, taskId);
    },
  });
}
