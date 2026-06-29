import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createWorkflow } from '@/features/workflows/api/workflows.api';
import type { CreateWorkflowPayload } from '@/features/workflows/api/workflow.types';
import { workflowsQueryKeys } from '@/features/workflows/hooks/use-workflows';

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) => createWorkflow(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all });
    },
  });
}
