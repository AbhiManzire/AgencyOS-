import { Injectable } from '@nestjs/common';
import type { SalesPipeline, SalesPipelineStage } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreatePipelineData,
  CreatePipelineStageData,
  PipelineRecord,
  PipelineRepository,
  PipelineScope,
  PipelineStageRecord,
  PipelineTransactionClient,
  UpdatePipelineStageData,
} from './pipeline.repository.interface';
import type { DealStage } from '@prisma/client';

type PipelineWithStages = SalesPipeline & { stages: SalesPipelineStage[] };

@Injectable()
export class PrismaPipelineRepository implements PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(scope: PipelineScope): Promise<readonly PipelineRecord[]> {
    const pipelines = await this.prisma.salesPipeline.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return pipelines.map(toPipelineRecord);
  }

  async findDefault(scope: PipelineScope): Promise<PipelineRecord | null> {
    const pipeline = await this.prisma.salesPipeline.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        isDefault: true,
        deletedAt: null,
      },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return pipeline ? toPipelineRecord(pipeline) : null;
  }

  async findById(scope: PipelineScope, id: string): Promise<PipelineRecord | null> {
    const pipeline = await this.prisma.salesPipeline.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return pipeline ? toPipelineRecord(pipeline) : null;
  }

  async create(
    data: CreatePipelineData,
    stages: readonly CreatePipelineStageData[],
    tx?: PipelineTransactionClient,
  ): Promise<PipelineRecord> {
    const db = tx ?? this.prisma;

    await db.salesPipeline.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        name: data.name,
        description: data.description ?? null,
        isDefault: data.isDefault,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    if (stages.length > 0) {
      await db.salesPipelineStage.createMany({
        data: stages.map((stage) => ({
          id: stage.id,
          tenantId: stage.tenantId,
          workspaceId: stage.workspaceId,
          pipelineId: stage.pipelineId,
          stageKey: stage.stageKey,
          name: stage.name,
          probability: stage.probability,
          colorToken: stage.colorToken ?? null,
          sortOrder: stage.sortOrder,
          isWonStage: stage.isWonStage,
          isLostStage: stage.isLostStage,
          createdAt: stage.createdAt,
          updatedAt: stage.updatedAt,
          createdByUserId: stage.createdByUserId ?? null,
          updatedByUserId: stage.updatedByUserId ?? null,
        })),
      });
    }

    const created = await db.salesPipeline.findFirstOrThrow({
      where: { id: data.id },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return toPipelineRecord(created);
  }

  async updateStage(
    scope: PipelineScope,
    pipelineId: string,
    stageId: string,
    data: UpdatePipelineStageData,
  ): Promise<PipelineStageRecord | null> {
    const result = await this.prisma.salesPipelineStage.updateMany({
      where: {
        id: stageId,
        pipelineId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.probability !== undefined ? { probability: data.probability } : {}),
        ...(data.colorToken !== undefined ? { colorToken: data.colorToken } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const stage = await this.prisma.salesPipelineStage.findFirst({
      where: {
        id: stageId,
        pipelineId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    return stage ? toStageRecord(stage) : null;
  }

  async findStageByKey(
    scope: PipelineScope,
    pipelineId: string,
    stageKey: DealStage,
  ): Promise<PipelineStageRecord | null> {
    const stage = await this.prisma.salesPipelineStage.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        pipelineId,
        stageKey,
        deletedAt: null,
      },
    });

    return stage ? toStageRecord(stage) : null;
  }
}

function toPipelineRecord(pipeline: PipelineWithStages): PipelineRecord {
  return {
    id: pipeline.id,
    tenantId: pipeline.tenantId,
    workspaceId: pipeline.workspaceId,
    name: pipeline.name,
    description: pipeline.description,
    isDefault: pipeline.isDefault,
    isActive: pipeline.isActive,
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
    createdByUserId: pipeline.createdByUserId,
    updatedByUserId: pipeline.updatedByUserId,
    deletedAt: pipeline.deletedAt,
    deletedByUserId: pipeline.deletedByUserId,
    stages: pipeline.stages.map(toStageRecord),
  };
}

function toStageRecord(stage: SalesPipelineStage): PipelineStageRecord {
  return {
    id: stage.id,
    tenantId: stage.tenantId,
    workspaceId: stage.workspaceId,
    pipelineId: stage.pipelineId,
    stageKey: stage.stageKey,
    name: stage.name,
    probability: stage.probability,
    colorToken: stage.colorToken,
    sortOrder: stage.sortOrder,
    isWonStage: stage.isWonStage,
    isLostStage: stage.isLostStage,
    createdAt: stage.createdAt,
    updatedAt: stage.updatedAt,
    createdByUserId: stage.createdByUserId,
    updatedByUserId: stage.updatedByUserId,
    deletedAt: stage.deletedAt,
    deletedByUserId: stage.deletedByUserId,
  };
}
