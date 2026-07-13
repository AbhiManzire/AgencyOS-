import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePipelineStage } from '@/features/sales/pipelines/api/pipelines.api';
import type { UpdatePipelineStagePayload } from '@/features/sales/pipelines/api/pipeline.types';
import { pipelinesQueryKeys } from '@/features/sales/pipelines/hooks/use-pipelines';

/** Updates a pipeline stage on the default (or specified) pipeline. */
export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pipelineId,
      stageId,
      payload,
    }: {
      pipelineId: string;
      stageId: string;
      payload: UpdatePipelineStagePayload;
    }) => updatePipelineStage(pipelineId, stageId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pipelinesQueryKeys.all });
    },
  });
}
