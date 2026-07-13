import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelSalesTask,
  completeSalesTask,
  createSalesTask,
  getSalesTask,
  listSalesTasks,
  reassignSalesTask,
  rescheduleSalesTask,
  updateSalesTask,
} from '@/features/sales/workspace/api/sales-tasks.api';
import type {
  CreateSalesTaskPayload,
  ListSalesTasksParams,
  ReassignSalesTaskPayload,
  RescheduleSalesTaskPayload,
  UpdateSalesTaskPayload,
} from '@/features/sales/workspace/api/sales-task.types';
import { invalidateWorkspaceCaches } from '@/features/sales/workspace/hooks/use-workspace-dashboard';
import { salesTasksQueryKeys } from '@/features/sales/workspace/hooks/workspace-query-keys';

/** TanStack Query hook for GET /sales-tasks. */
export function useSalesTasks(
  params: ListSalesTasksParams = {},
  options?: { readonly enabled?: boolean },
) {
  return useQuery({
    queryKey: salesTasksQueryKeys.list(params),
    queryFn: () => listSalesTasks(params),
    enabled: options?.enabled ?? true,
  });
}

/** TanStack Query hook for GET /sales-tasks/:id. */
export function useSalesTask(id: string, options?: { readonly enabled?: boolean }) {
  return useQuery({
    queryKey: salesTasksQueryKeys.detail(id),
    queryFn: () => getSalesTask(id),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

/** Creates a sales task and refreshes workspace caches. */
export function useCreateSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSalesTaskPayload) => createSalesTask(payload),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}

/** Updates a sales task and refreshes workspace caches. */
export function useUpdateSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalesTaskPayload }) =>
      updateSalesTask(id, payload),
    onSuccess: async (_data, variables) => {
      await invalidateWorkspaceCaches(queryClient);
      await queryClient.invalidateQueries({
        queryKey: salesTasksQueryKeys.detail(variables.id),
      });
    },
  });
}

/** Completes a sales task. */
export function useCompleteSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeSalesTask(id),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}

/** Cancels a sales task. */
export function useCancelSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelSalesTask(id),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}

/** Reschedules a sales task. */
export function useRescheduleSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleSalesTaskPayload }) =>
      rescheduleSalesTask(id, payload),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}

/** Reassigns a sales task. */
export function useReassignSalesTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReassignSalesTaskPayload }) =>
      reassignSalesTask(id, payload),
    onSuccess: async () => {
      await invalidateWorkspaceCaches(queryClient);
    },
  });
}
