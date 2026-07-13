import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_PIPELINE_NAME, DEFAULT_PIPELINE_STAGES } from '../domain/default-pipeline.catalog';
import {
  PIPELINE_REPOSITORY,
  type CreatePipelineStageData,
  type PipelineRecord,
  type PipelineRepository,
  type PipelineScope,
  type PipelineStageRecord,
} from '../repositories/pipeline.repository.interface';
import type {
  PipelineApplicationContext,
  UpdatePipelineStageCommand,
} from './pipeline-application.types';

@Injectable()
export class SalesPipelineService {
  constructor(
    @Inject(PIPELINE_REPOSITORY)
    private readonly pipelineRepository: PipelineRepository,
    private readonly prisma: PrismaService,
  ) {}

  async listPipelines(scope: PipelineScope): Promise<readonly PipelineRecord[]> {
    await this.ensureDefaultPipeline(scope, null);
    return this.pipelineRepository.list(scope);
  }

  async getDefaultPipeline(scope: PipelineScope): Promise<PipelineRecord> {
    return this.ensureDefaultPipeline(scope, null);
  }

  async ensureDefaultPipeline(
    scope: PipelineScope,
    actorUserId: string | null,
  ): Promise<PipelineRecord> {
    const existing = await this.pipelineRepository.findDefault(scope);
    if (existing !== null) {
      return existing;
    }

    const now = new Date();
    const pipelineId = randomUUID();

    const stages: CreatePipelineStageData[] = DEFAULT_PIPELINE_STAGES.map((definition) => ({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      pipelineId,
      stageKey: definition.stageKey,
      name: definition.name,
      probability: definition.probability,
      colorToken: definition.colorToken,
      sortOrder: definition.sortOrder,
      isWonStage: definition.isWonStage,
      isLostStage: definition.isLostStage,
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    }));

    return this.prisma.$transaction(async (tx) =>
      this.pipelineRepository.create(
        {
          id: pipelineId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          name: DEFAULT_PIPELINE_NAME,
          description: 'System default sales pipeline',
          isDefault: true,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
        stages,
        tx,
      ),
    );
  }

  async updateStage(
    scope: PipelineScope,
    pipelineId: string,
    stageId: string,
    command: UpdatePipelineStageCommand,
    context: PipelineApplicationContext,
  ): Promise<PipelineStageRecord> {
    const pipeline = await this.pipelineRepository.findById(scope, pipelineId);
    if (pipeline === null) {
      throw new NotFoundException('Pipeline was not found.');
    }

    const now = new Date();
    const updated = await this.pipelineRepository.updateStage(scope, pipelineId, stageId, {
      ...(command.name !== undefined ? { name: command.name.trim() } : {}),
      ...(command.probability !== undefined ? { probability: command.probability } : {}),
      ...(command.colorToken !== undefined ? { colorToken: command.colorToken } : {}),
      ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    });

    if (updated === null) {
      throw new NotFoundException('Pipeline stage was not found.');
    }

    return updated;
  }
}
