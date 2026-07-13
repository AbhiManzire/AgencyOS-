import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteWorkflow,
  disableWorkflow,
  enableWorkflow,
  executeWorkflow,
  updateWorkflow,
} from '@/features/workflows/api/workflows.api';
import type {
  ExecuteWorkflowPayload,
  UpdateWorkflowPayload,
} from '@/features/workflows/api/workflow.types';
import { workflowsQueryKeys } from '@/features/workflows/hooks/use-workflows';
import { executionsQueryKeys } from '@/features/workflows/executions/hooks/use-executions';

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      payload,
    }: {
      readonly workflowId: string;
      readonly payload: UpdateWorkflowPayload;
    }) => updateWorkflow(workflowId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: workflowsQueryKeys.detail(variables.workflowId),
        }),
      ]);
    },
  });
}

export function useEnableWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => enableWorkflow(workflowId),
    onSuccess: async (_data, workflowId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.detail(workflowId) }),
      ]);
    },
  });
}

export function useDisableWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => disableWorkflow(workflowId),
    onSuccess: async (_data, workflowId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.detail(workflowId) }),
      ]);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(workflowId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workflowsQueryKeys.all });
    },
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workflowId,
      payload,
    }: {
      readonly workflowId: string;
      readonly payload?: ExecuteWorkflowPayload;
    }) => executeWorkflow(workflowId, payload),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: executionsQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: [...workflowsQueryKeys.all, 'executions', variables.workflowId],
        }),
      ]);
    },
  });
}
