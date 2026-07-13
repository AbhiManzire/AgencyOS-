import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CreateWorkflowPayload,
  ExecuteWorkflowPayload,
  ListWorkflowsParams,
  ListWorkflowsResult,
  UpdateWorkflowPayload,
  WorkflowRecord,
} from '@/features/workflows/api/workflow.types';
import type { WorkflowExecutionRecord } from '@/features/workflows/executions/api/execution.types';

export async function listWorkflows(
  params: ListWorkflowsParams = {},
): Promise<ListWorkflowsResult> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowRecord[]>>('/workflows', {
    params,
  });
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}

export async function getWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowRecord>>(
    `/workflows/${workflowId}`,
  );
  return response.data.data;
}

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<WorkflowRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowRecord>>('/workflows', payload);
  return response.data.data;
}

export async function updateWorkflow(
  workflowId: string,
  payload: UpdateWorkflowPayload,
): Promise<WorkflowRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<WorkflowRecord>>(
    `/workflows/${workflowId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<WorkflowRecord>>(
    `/workflows/${workflowId}`,
  );
  return response.data.data;
}

export async function enableWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowRecord>>(
    `/workflows/${workflowId}/enable`,
  );
  return response.data.data;
}

export async function disableWorkflow(workflowId: string): Promise<WorkflowRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowRecord>>(
    `/workflows/${workflowId}/disable`,
  );
  return response.data.data;
}

export async function executeWorkflow(
  workflowId: string,
  payload: ExecuteWorkflowPayload = {},
): Promise<WorkflowExecutionRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowExecutionRecord>>(
    `/workflows/${workflowId}/execute`,
    payload,
  );
  return response.data.data;
}

export async function listWorkflowExecutions(
  workflowId: string,
  params: { readonly skip?: number; readonly take?: number } = {},
): Promise<{
  readonly items: readonly WorkflowExecutionRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowExecutionRecord[]>>(
    `/workflows/${workflowId}/executions`,
    { params },
  );
  const { data, meta } = response.data;

  return {
    items: data,
    total: meta?.total ?? data.length,
    skip: meta?.skip ?? params.skip ?? 0,
    take: meta?.take ?? params.take ?? 25,
  };
}
