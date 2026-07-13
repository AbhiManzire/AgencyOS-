import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  PipelineRecord,
  PipelineStageRecord,
  UpdatePipelineStagePayload,
} from '@/features/sales/pipelines/api/pipeline.types';

/** Lists pipelines for the active workspace. */
export async function listPipelines(): Promise<readonly PipelineRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<PipelineRecord[]>>('/pipelines');
  return response.data.data;
}

/** Fetches the default sales pipeline (creates one if missing on the backend). */
export async function getDefaultPipeline(): Promise<PipelineRecord> {
  const response = await apiClient.get<ApiSuccessResponse<PipelineRecord>>('/pipelines/default');
  return response.data.data;
}

/** Updates a pipeline stage label, probability, or color. */
export async function updatePipelineStage(
  pipelineId: string,
  stageId: string,
  payload: UpdatePipelineStagePayload,
): Promise<PipelineStageRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<PipelineStageRecord>>(
    `/pipelines/${pipelineId}/stages/${stageId}`,
    payload,
  );
  return response.data.data;
}
