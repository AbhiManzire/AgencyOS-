import { Injectable } from '@nestjs/common';
import { Prisma, type Task, type User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateTaskData,
  FindTaskByIdOptions,
  ListTasksParams,
  ListTasksResult,
  SoftDeleteTaskData,
  TaskRecord,
  TaskRepository,
  TaskScope,
  UpdateTaskData,
} from './task.repository.interface';

type TaskWithRelations = Task & {
  assigneeUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
  createdByUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
  _count?: {
    subtasks: number;
  };
};

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskData): Promise<TaskRecord> {
    const task = await this.prisma.task.create({
      data: {
        ...data,
        estimatedHours:
          data.estimatedHours === undefined || data.estimatedHours === null
            ? null
            : new Prisma.Decimal(data.estimatedHours),
      },
      include: taskRelationsInclude,
    });

    return toTaskRecord(task);
  }

  async update(scope: TaskScope, id: string, data: UpdateTaskData): Promise<TaskRecord | null> {
    const { estimatedHours, ...rest } = data;

    const result = await this.prisma.task.updateMany({
      where: activeTaskWhere(scope, id),
      data: {
        ...rest,
        ...(estimatedHours !== undefined
          ? {
              estimatedHours: estimatedHours === null ? null : new Prisma.Decimal(estimatedHours),
            }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: TaskScope,
    id: string,
    data: SoftDeleteTaskData,
  ): Promise<TaskRecord | null> {
    const result = await this.prisma.task.updateMany({
      where: activeTaskWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id, { includeArchived: true });
  }

  async findById(
    scope: TaskScope,
    id: string,
    options?: FindTaskByIdOptions,
  ): Promise<TaskRecord | null> {
    const task = await this.prisma.task.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: detailInclude,
    });

    return task ? toTaskRecord(task) : null;
  }

  async list(params: ListTasksParams): Promise<ListTasksResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      projectId,
      milestoneId,
      parentTaskId,
      topLevelOnly = parentTaskId === undefined,
      status,
      assigneeUserId,
      includeArchived = false,
    } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(projectId !== undefined ? { projectId } : {}),
      ...(milestoneId !== undefined ? { milestoneId } : {}),
      ...(parentTaskId !== undefined ? { parentTaskId } : {}),
      ...(topLevelOnly && parentTaskId === undefined ? { parentTaskId: null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(assigneeUserId !== undefined ? { assigneeUserId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        include: listInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map(toTaskRecord),
      total,
    };
  }

  async isWorkspaceUser(scope: TaskScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    return employee !== null;
  }
}

const userSelect = {
  displayName: true,
  email: true,
  firstName: true,
  lastName: true,
} as const;

const taskRelationsInclude = {
  assigneeUser: {
    select: userSelect,
  },
  createdByUser: {
    select: userSelect,
  },
} as const;

const subtaskCountSelect = {
  subtasks: {
    where: { deletedAt: null },
  },
} as const;

const listInclude = {
  ...taskRelationsInclude,
  _count: {
    select: subtaskCountSelect,
  },
} as const;

const detailInclude = {
  ...taskRelationsInclude,
  _count: {
    select: subtaskCountSelect,
  },
} as const;

function activeTaskWhere(scope: TaskScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function toEstimatedHours(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }

  return value.toNumber();
}

function toTaskRecord(task: TaskWithRelations): TaskRecord {
  return {
    id: task.id,
    tenantId: task.tenantId,
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    milestoneId: task.milestoneId,
    parentTaskId: task.parentTaskId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigneeUserId: task.assigneeUserId,
    assigneeDisplayName:
      task.assigneeUser === null ? null : resolveUserDisplayName(task.assigneeUser),
    assigneeEmail: task.assigneeUser?.email ?? null,
    startDate: task.startDate,
    dueDate: task.dueDate,
    estimatedHours: toEstimatedHours(task.estimatedHours),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdByUserId: task.createdByUserId,
    createdByDisplayName:
      task.createdByUser === null ? null : resolveUserDisplayName(task.createdByUser),
    updatedByUserId: task.updatedByUserId,
    deletedAt: task.deletedAt,
    deletedByUserId: task.deletedByUserId,
    subtaskCount: task._count?.subtasks ?? 0,
  };
}
