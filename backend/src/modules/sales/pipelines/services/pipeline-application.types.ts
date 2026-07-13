import type {
  PipelineRecord,
  PipelineScope,
  PipelineStageRecord,
} from '../repositories/pipeline.repository.interface';

export interface PipelineApplicationContext {
  readonly actorUserId: string;
}

export interface UpdatePipelineStageCommand {
  readonly name?: string;
  readonly probability?: number;
  readonly colorToken?: string | null;
  readonly sortOrder?: number;
}

export type { PipelineRecord, PipelineScope, PipelineStageRecord };
