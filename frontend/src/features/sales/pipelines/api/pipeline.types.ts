import type { DealStage } from '@/features/sales/types';

export interface PipelineStageRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly pipelineId: string;
  readonly stageKey: DealStage;
  readonly name: string;
  readonly probability: number;
  readonly colorToken: string | null;
  readonly sortOrder: number;
  readonly isWonStage: boolean;
  readonly isLostStage: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface PipelineRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
  readonly stages: readonly PipelineStageRecord[];
}

export interface UpdatePipelineStagePayload {
  readonly name?: string;
  readonly probability?: number;
  readonly colorToken?: string | null;
  readonly sortOrder?: number;
}
