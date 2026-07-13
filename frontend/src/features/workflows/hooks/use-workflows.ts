import { useQuery } from '@tanstack/react-query';
import { workflowRecordToListItem } from '@/features/workflows/api/workflow.mapper';
import { listWorkflows } from '@/features/workflows/api/workflows.api';
import type { ListWorkflowsParams } from '@/features/workflows/api/workflow.types';

export const workflowsQueryKeys = {
  all: ['workflows'] as const,
  list: (params: ListWorkflowsParams) => [...workflowsQueryKeys.all, 'list', params] as const,
  detail: (workflowId: string) => [...workflowsQueryKeys.all, 'detail', workflowId] as const,
  executions: (workflowId: string, params: object) =>
    [...workflowsQueryKeys.all, 'executions', workflowId, params] as const,
};

export function useWorkflows(params: ListWorkflowsParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workflowsQueryKeys.list(params),
    queryFn: async () => {
      const result = await listWorkflows(params);
      return {
        ...result,
        items: result.items.map(workflowRecordToListItem),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
