import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateTaskDependencyData,
  TaskDependencyRecord,
  TaskDependencyRepository,
  TaskScope,
} from './task.repository.interface';

const TERMINAL_STATUSES: readonly TaskStatus[] = [
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
  TaskStatus.ARCHIVED,
];

@Injectable()
export class PrismaTaskDependencyRepository implements TaskDependencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listBlockedBy(scope: TaskScope, taskId: string): Promise<readonly TaskDependencyRecord[]> {
    const rows = await this.prisma.taskDependency.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId,
      },
      include: {
        dependsOnTask: {
          select: { title: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      workspaceId: row.workspaceId,
      taskId: row.taskId,
      dependsOnTaskId: row.dependsOnTaskId,
      dependsOnTitle: row.dependsOnTask.title,
      dependsOnStatus: row.dependsOnTask.status,
      createdAt: row.createdAt,
    }));
  }

  async create(data: CreateTaskDependencyData): Promise<TaskDependencyRecord> {
    const row = await this.prisma.taskDependency.create({
      data,
      include: {
        dependsOnTask: {
          select: { title: true, status: true },
        },
      },
    });

    return {
      id: row.id,
      tenantId: row.tenantId,
      workspaceId: row.workspaceId,
      taskId: row.taskId,
      dependsOnTaskId: row.dependsOnTaskId,
      dependsOnTitle: row.dependsOnTask.title,
      dependsOnStatus: row.dependsOnTask.status,
      createdAt: row.createdAt,
    };
  }

  async delete(scope: TaskScope, taskId: string, dependencyId: string): Promise<boolean> {
    const result = await this.prisma.taskDependency.deleteMany({
      where: {
        id: dependencyId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId,
      },
    });

    return result.count > 0;
  }

  async exists(scope: TaskScope, taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const existing = await this.prisma.taskDependency.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId,
        dependsOnTaskId,
      },
      select: { id: true },
    });

    return existing !== null;
  }

  async wouldCreateCycle(
    scope: TaskScope,
    taskId: string,
    dependsOnTaskId: string,
  ): Promise<boolean> {
    // If dependsOnTask already depends (transitively) on taskId, adding taskId → dependsOnTaskId cycles.
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || visited.has(current)) {
        continue;
      }

      if (current === taskId) {
        return true;
      }

      visited.add(current);

      const next = await this.prisma.taskDependency.findMany({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          taskId: current,
        },
        select: { dependsOnTaskId: true },
      });

      for (const edge of next) {
        queue.push(edge.dependsOnTaskId);
      }
    }

    return false;
  }

  async hasIncompleteBlockedBy(scope: TaskScope, taskId: string): Promise<boolean> {
    const incomplete = await this.prisma.taskDependency.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId,
        dependsOnTask: {
          deletedAt: null,
          status: { notIn: [...TERMINAL_STATUSES] },
        },
      },
      select: { id: true },
    });

    return incomplete !== null;
  }
}
