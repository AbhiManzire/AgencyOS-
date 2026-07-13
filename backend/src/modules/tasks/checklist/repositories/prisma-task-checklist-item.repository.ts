import { Injectable } from '@nestjs/common';
import type { TaskChecklistItem } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateTaskChecklistItemData,
  SoftDeleteTaskChecklistItemData,
  TaskChecklistItemRecord,
  TaskChecklistItemRepository,
  TaskChecklistItemScope,
  UpdateTaskChecklistItemData,
} from './task-checklist-item.repository.interface';

@Injectable()
export class PrismaTaskChecklistItemRepository implements TaskChecklistItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskChecklistItemData): Promise<TaskChecklistItemRecord> {
    const item = await this.prisma.taskChecklistItem.create({ data });
    return toRecord(item);
  }

  async update(
    scope: TaskChecklistItemScope,
    id: string,
    data: UpdateTaskChecklistItemData,
  ): Promise<TaskChecklistItemRecord | null> {
    const result = await this.prisma.taskChecklistItem.updateMany({
      where: activeItemWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: TaskChecklistItemScope,
    id: string,
  ): Promise<TaskChecklistItemRecord | null> {
    const item = await this.prisma.taskChecklistItem.findFirst({
      where: activeItemWhere(scope, id),
    });

    return item ? toRecord(item) : null;
  }

  async listByTask(scope: TaskChecklistItemScope): Promise<readonly TaskChecklistItemRecord[]> {
    const items = await this.prisma.taskChecklistItem.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId: scope.taskId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return items.map(toRecord);
  }

  async getNextSortOrder(scope: TaskChecklistItemScope): Promise<number> {
    const latest = await this.prisma.taskChecklistItem.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId: scope.taskId,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'desc' }],
      select: { sortOrder: true },
    });

    return (latest?.sortOrder ?? -1) + 1;
  }

  async softDelete(
    scope: TaskChecklistItemScope,
    id: string,
    data: SoftDeleteTaskChecklistItemData,
  ): Promise<TaskChecklistItemRecord | null> {
    const result = await this.prisma.taskChecklistItem.updateMany({
      where: activeItemWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const deleted = await this.prisma.taskChecklistItem.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId: scope.taskId,
      },
    });

    return deleted ? toRecord(deleted) : null;
  }
}

function activeItemWhere(scope: TaskChecklistItemScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    taskId: scope.taskId,
    deletedAt: null,
  };
}

function toRecord(item: TaskChecklistItem): TaskChecklistItemRecord {
  return {
    id: item.id,
    tenantId: item.tenantId,
    workspaceId: item.workspaceId,
    taskId: item.taskId,
    title: item.title,
    isCompleted: item.isCompleted,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    createdByUserId: item.createdByUserId,
    updatedByUserId: item.updatedByUserId,
    deletedAt: item.deletedAt,
    deletedByUserId: item.deletedByUserId,
  };
}
