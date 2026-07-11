import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EnsureTagData,
  TaskTagRecord,
  TaskTagRepository,
  TaskTagScope,
} from './task.repository.interface';

@Injectable()
export class PrismaTaskTagRepository implements TaskTagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByTask(scope: TaskTagScope): Promise<readonly TaskTagRecord[]> {
    const rows = await this.prisma.taskTag.findMany({
      where: {
        tenantId: scope.tenantId,
        taskId: scope.taskId,
        tag: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
        },
      },
      include: { tag: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.tag.id,
      name: row.tag.name,
      colorToken: row.tag.colorToken,
      description: row.tag.description,
      assignedAt: row.createdAt,
    }));
  }

  async findTagByName(
    scope: Pick<TaskTagScope, 'tenantId' | 'workspaceId'>,
    name: string,
  ): Promise<{
    id: string;
    name: string;
    colorToken: string | null;
    description: string | null;
  } | null> {
    const tag = await this.prisma.tag.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name,
        deletedAt: null,
      },
    });

    if (tag === null) {
      return null;
    }

    return {
      id: tag.id,
      name: tag.name,
      colorToken: tag.colorToken,
      description: tag.description,
    };
  }

  async createTag(
    scope: Pick<TaskTagScope, 'tenantId' | 'workspaceId'>,
    data: EnsureTagData,
  ): Promise<{ id: string; name: string; colorToken: string | null; description: string | null }> {
    const tag = await this.prisma.tag.create({
      data: {
        id: data.id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name: data.name,
        colorToken: data.colorToken ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      colorToken: tag.colorToken,
      description: tag.description,
    };
  }

  async isAssigned(scope: TaskTagScope, tagId: string): Promise<boolean> {
    const existing = await this.prisma.taskTag.findUnique({
      where: {
        tenantId_taskId_tagId: {
          tenantId: scope.tenantId,
          taskId: scope.taskId,
          tagId,
        },
      },
    });

    return existing !== null;
  }

  async assign(scope: TaskTagScope, tagId: string, assignedAt: Date): Promise<TaskTagRecord> {
    const row = await this.prisma.taskTag.create({
      data: {
        tenantId: scope.tenantId,
        taskId: scope.taskId,
        tagId,
        createdAt: assignedAt,
      },
      include: { tag: true },
    });

    return {
      id: row.tag.id,
      name: row.tag.name,
      colorToken: row.tag.colorToken,
      description: row.tag.description,
      assignedAt: row.createdAt,
    };
  }

  async unassign(scope: TaskTagScope, tagId: string): Promise<boolean> {
    const result = await this.prisma.taskTag.deleteMany({
      where: {
        tenantId: scope.tenantId,
        taskId: scope.taskId,
        tagId,
      },
    });

    return result.count > 0;
  }
}
