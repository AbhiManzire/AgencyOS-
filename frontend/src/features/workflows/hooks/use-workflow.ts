import { useQuery } from '@tanstack/react-query';
import { getWorkflow } from '@/features/workflows/api/workflows.api';
import { workflowsQueryKeys } from '@/features/workflows/hooks/use-workflows';

export function useWorkflow(workflowId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: workflowsQueryKeys.detail(workflowId),
    queryFn: () => getWorkflow(workflowId),
    enabled: (options?.enabled ?? true) && workflowId.length > 0,
  });
}
