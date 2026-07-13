import type { UpdatePipelineStageCommand } from '../services/pipeline-application.types';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';

export const PipelineMapper = {
  toUpdatePipelineStageCommand(dto: UpdatePipelineStageDto): UpdatePipelineStageCommand {
    return {
      name: dto.name,
      probability: dto.probability,
      colorToken: dto.colorToken,
      sortOrder: dto.sortOrder,
    };
  },
};
