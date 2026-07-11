import { Injectable } from '@nestjs/common';
import { Prisma, type Task, type User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateTaskData,
  FindTaskByIdOptions,
  ListTasksParams,
  ListTasksResult,
  RestoreTaskData,
  SoftDeleteTaskData,
  TaskRecord,
  TaskRepository,
  TaskScope,
  TaskSortBy,
  UpdateTaskData,
} from './task.repository.interface';

type TaskWithRelations = Task & {
  project?: { clientId: string } | null;
  assigneeUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
  reporterUser?: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
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
        estimatedHours: toDecimalOrNull(data.estimatedHours),
        actualHours: toDecimalOrNull(data.actualHours),
      },
      include: detailInclude,
    });

    return toTaskRecord(task);
  }

  async update(scope: TaskScope, id: string, data: UpdateTaskData): Promise<TaskRecord | null> {
    const { estimatedHours, actualHours, ...rest } = data;

    const result = await this.prisma.task.updateMany({
      where: activeTaskWhere(scope, id),
      data: {
        ...rest,
        ...(estimatedHours !== undefined
          ? { estimatedHours: toDecimalOrNull(estimatedHours) }
          : {}),
        ...(actualHours !== undefined ? { actualHours: toDecimalOrNull(actualHours) } : {}),
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

  async restore(scope: TaskScope, id: string, data: RestoreTaskData): Promise<TaskRecord | null> {
    const result = await this.prisma.task.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: { not: null },
      },
      data: {
        status: data.status,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
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

  async findByCode(scope: TaskScope, code: string): Promise<TaskRecord | null> {
    const task = await this.prisma.task.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        code,
        deletedAt: null,
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
      priority,
      type,
      assigneeUserId,
      reporterUserId,
      q,
      dueFrom,
      dueTo,
      boardOrderFrom,
      boardOrderTo,
      includeArchived = false,
      archivedOnly = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.TaskWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(archivedOnly ? { deletedAt: { not: null } } : includeArchived ? {} : { deletedAt: null }),
      ...(projectId !== undefined ? { projectId } : {}),
      ...(milestoneId !== undefined ? { milestoneId } : {}),
      ...(parentTaskId !== undefined ? { parentTaskId } : {}),
      ...(topLevelOnly && parentTaskId === undefined ? { parentTaskId: null } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(assigneeUserId !== undefined ? { assigneeUserId } : {}),
      ...(reporterUserId !== undefined ? { reporterUserId } : {}),
      ...(q !== undefined && q.trim().length > 0
        ? {
            OR: [
              { title: { contains: q.trim(), mode: 'insensitive' } },
              { description: { contains: q.trim(), mode: 'insensitive' } },
              { code: { contains: q.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(dueFrom !== undefined || dueTo !== undefined
        ? {
            dueDate: {
              ...(dueFrom !== undefined ? { gte: dueFrom } : {}),
              ...(dueTo !== undefined ? { lte: dueTo } : {}),
            },
          }
        : {}),
      ...(boardOrderFrom !== undefined || boardOrderTo !== undefined
        ? {
            boardOrder: {
              ...(boardOrderFrom !== undefined ? { gte: boardOrderFrom } : {}),
              ...(boardOrderTo !== undefined ? { lte: boardOrderTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        include: listInclude,
        orderBy: resolveOrderBy(sortBy, sortOrder),
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map(toTaskRecord),
      total,
    };
  }

  async countOpenSubtasks(scope: TaskScope, parentTaskId: string): Promise<number> {
    return this.prisma.task.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        parentTaskId,
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED', 'ARCHIVED'] },
      },
    });
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
  project: {
    select: { clientId: true },
  },
  assigneeUser: {
    select: userSelect,
  },
  reporterUser: {
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

function resolveOrderBy(
  sortBy: TaskSortBy,
  sortOrder: 'asc' | 'desc',
): Prisma.TaskOrderByWithRelationInput {
  switch (sortBy) {
    case 'dueDate':
      return { dueDate: sortOrder };
    case 'priority':
      return { priority: sortOrder };
    case 'status':
      return { status: sortOrder };
    case 'title':
      return { title: sortOrder };
    case 'boardOrder':
      return { boardOrder: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
    default:
      return { updatedAt: sortOrder };
  }
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

function toDecimalOrNull(value?: number | null): Prisma.Decimal | null {
  if (value === undefined || value === null) {
    return null;
  }

  return new Prisma.Decimal(value);
}

function toHours(value: Prisma.Decimal | null): number | null {
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
    clientId: task.project?.clientId ?? null,
    milestoneId: task.milestoneId,
    parentTaskId: task.parentTaskId,
    code: task.code,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    type: task.type,
    assigneeUserId: task.assigneeUserId,
    assigneeDisplayName:
      task.assigneeUser === null ? null : resolveUserDisplayName(task.assigneeUser),
    assigneeEmail: task.assigneeUser?.email ?? null,
    reporterUserId: task.reporterUserId,
    reporterDisplayName:
      task.reporterUser === null || task.reporterUser === undefined
        ? null
        : resolveUserDisplayName(task.reporterUser),
    reporterEmail: task.reporterUser?.email ?? null,
    startDate: task.startDate,
    dueDate: task.dueDate,
    estimatedHours: toHours(task.estimatedHours),
    actualHours: toHours(task.actualHours),
    completedAt: task.completedAt,
    boardOrder: task.boardOrder,
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
