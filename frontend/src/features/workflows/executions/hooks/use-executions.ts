import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getExecution,
  getExecutionLogs,
  listExecutions,
  retryExecution,
} from '@/features/workflows/executions/api/executions.api';
import type { ListExecutionsParams } from '@/features/workflows/executions/api/execution.types';
import { listWorkflowExecutions } from '@/features/workflows/api/workflows.api';
import { workflowsQueryKeys } from '@/features/workflows/hooks/use-workflows';

export const executionsQueryKeys = {
  all: ['automation-executions'] as const,
  list: (params: ListExecutionsParams) => [...executionsQueryKeys.all, 'list', params] as const,
  detail: (executionId: string) => [...executionsQueryKeys.all, 'detail', executionId] as const,
  logs: (executionId: string) => [...executionsQueryKeys.all, 'logs', executionId] as const,
};

export function useExecutions(params: ListExecutionsParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: executionsQueryKeys.list(params),
    queryFn: () => listExecutions(params),
    enabled: options?.enabled ?? true,
  });
}

export function useWorkflowExecutions(
  workflowId: string,
  params: { readonly skip?: number; readonly take?: number } = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: workflowsQueryKeys.executions(workflowId, params),
    queryFn: async () => {
      try {
        return await listWorkflowExecutions(workflowId, params);
      } catch {
        return listExecutions({ workflowId, ...params });
      }
    },
    enabled: (options?.enabled ?? true) && workflowId.length > 0,
  });
}

export function useExecution(executionId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: executionsQueryKeys.detail(executionId),
    queryFn: () => getExecution(executionId),
    enabled: (options?.enabled ?? true) && executionId.length > 0,
  });
}

export function useExecutionLogs(executionId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: executionsQueryKeys.logs(executionId),
    queryFn: () => getExecutionLogs(executionId),
    enabled: (options?.enabled ?? true) && executionId.length > 0,
  });
}

export function useRetryExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (executionId: string) => retryExecution(executionId),
    onSuccess: async (_data, executionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: executionsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: executionsQueryKeys.detail(executionId) }),
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all }),
      ]);
    },
  });
}
