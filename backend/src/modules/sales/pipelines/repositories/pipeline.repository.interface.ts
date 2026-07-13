import type { DealStage, Prisma } from '@prisma/client';

export const PIPELINE_REPOSITORY = Symbol('PIPELINE_REPOSITORY');

export type PipelineTransactionClient = Prisma.TransactionClient;

export interface PipelineScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
  readonly stages: readonly PipelineStageRecord[];
}

export interface CreatePipelineData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly isDefault: boolean;
  readonly isActive?: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface CreatePipelineStageData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly pipelineId: string;
  readonly stageKey: DealStage;
  readonly name: string;
  readonly probability: number;
  readonly colorToken?: string | null;
  readonly sortOrder: number;
  readonly isWonStage: boolean;
  readonly isLostStage: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdatePipelineStageData {
  readonly name?: string;
  readonly probability?: number;
  readonly colorToken?: string | null;
  readonly sortOrder?: number;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface PipelineRepository {
  list(scope: PipelineScope): Promise<readonly PipelineRecord[]>;
  findDefault(scope: PipelineScope): Promise<PipelineRecord | null>;
  findById(scope: PipelineScope, id: string): Promise<PipelineRecord | null>;
  create(
    data: CreatePipelineData,
    stages: readonly CreatePipelineStageData[],
    tx?: PipelineTransactionClient,
  ): Promise<PipelineRecord>;
  updateStage(
    scope: PipelineScope,
    pipelineId: string,
    stageId: string,
    data: UpdatePipelineStageData,
  ): Promise<PipelineStageRecord | null>;
  findStageByKey(
    scope: PipelineScope,
    pipelineId: string,
    stageKey: DealStage,
  ): Promise<PipelineStageRecord | null>;
}
