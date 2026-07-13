import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  ListExecutionsParams,
  ListExecutionsResult,
  WorkflowExecutionLogRecord,
  WorkflowExecutionRecord,
  WorkflowExecutionWithLogsRecord,
} from '@/features/workflows/executions/api/execution.types';

export async function listExecutions(
  params: ListExecutionsParams = {},
): Promise<ListExecutionsResult> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowExecutionRecord[]>>(
    '/automation/executions',
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

export async function getExecution(executionId: string): Promise<WorkflowExecutionWithLogsRecord> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowExecutionWithLogsRecord>>(
    `/automation/executions/${executionId}`,
  );
  return response.data.data;
}

export async function getExecutionLogs(
  executionId: string,
): Promise<readonly WorkflowExecutionLogRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<WorkflowExecutionLogRecord[]>>(
    `/automation/executions/${executionId}/logs`,
  );
  return response.data.data;
}

export async function retryExecution(executionId: string): Promise<WorkflowExecutionRecord> {
  const response = await apiClient.post<ApiSuccessResponse<WorkflowExecutionRecord>>(
    `/automation/executions/${executionId}/retry`,
  );
  return response.data.data;
}
