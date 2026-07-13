import { Injectable } from '@nestjs/common';
import { Prisma, type SalesTask, type SalesTaskStatus, type User } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  CreateSalesTaskData,
  ListSalesTasksParams,
  ListSalesTasksResult,
  SalesTaskRecord,
  SalesTaskRepository,
  SalesTaskScope,
  SoftDeleteSalesTaskData,
  UpdateSalesTaskData,
} from './sales-task.repository.interface';

type SalesTaskWithOwner = SalesTask & {
  ownerUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaSalesTaskRepository implements SalesTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSalesTaskData): Promise<SalesTaskRecord> {
    const task = await this.prisma.salesTask.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        ownerUserId: data.ownerUserId,
        dueDate: data.dueDate,
        dueTime: data.dueTime ?? null,
        dueAt: data.dueAt,
        priority: data.priority ?? 'MEDIUM',
        leadId: data.leadId ?? null,
        dealId: data.dealId ?? null,
        clientId: data.clientId ?? null,
        status: data.status ?? 'PENDING',
        metadata: data.metadata === undefined ? undefined : (data.metadata ?? Prisma.JsonNull),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: ownerInclude,
    });

    return toSalesTaskRecord(task);
  }

  async update(
    scope: SalesTaskScope,
    id: string,
    data: UpdateSalesTaskData,
  ): Promise<SalesTaskRecord | null> {
    const result = await this.prisma.salesTask.updateMany({
      where: activeSalesTaskWhere(scope, id),
      data: {
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.ownerUserId !== undefined ? { ownerUserId: data.ownerUserId } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        ...(data.dueTime !== undefined ? { dueTime: data.dueTime } : {}),
        ...(data.dueAt !== undefined ? { dueAt: data.dueAt } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.leadId !== undefined ? { leadId: data.leadId } : {}),
        ...(data.dealId !== undefined ? { dealId: data.dealId } : {}),
        ...(data.clientId !== undefined ? { clientId: data.clientId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.cancelledAt !== undefined ? { cancelledAt: data.cancelledAt } : {}),
        ...(data.activityId !== undefined ? { activityId: data.activityId } : {}),
        ...(data.metadata !== undefined
          ? {
              metadata: data.metadata ?? Prisma.JsonNull,
            }
          : {}),
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: SalesTaskScope,
    id: string,
    data: SoftDeleteSalesTaskData,
  ): Promise<SalesTaskRecord | null> {
    const result = await this.prisma.salesTask.updateMany({
      where: activeSalesTaskWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const task = await this.prisma.salesTask.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
      include: ownerInclude,
    });

    return task ? toSalesTaskRecord(task) : null;
  }

  async findById(scope: SalesTaskScope, id: string): Promise<SalesTaskRecord | null> {
    const task = await this.prisma.salesTask.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: ownerInclude,
    });

    return task ? toSalesTaskRecord(task) : null;
  }

  async list(params: ListSalesTasksParams): Promise<ListSalesTasksResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      ownerUserId,
      status,
      type,
      from,
      to,
      leadId,
      dealId,
      clientId,
    } = params;

    const where: Prisma.SalesTaskWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(leadId !== undefined ? { leadId } : {}),
      ...(dealId !== undefined ? { dealId } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(from !== undefined || to !== undefined
        ? {
            dueAt: {
              ...(from !== undefined ? { gte: from } : {}),
              ...(to !== undefined ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.salesTask.count({ where }),
      this.prisma.salesTask.findMany({
        where,
        skip,
        take,
        include: ownerInclude,
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }],
      }),
    ]);

    return {
      items: items.map(toSalesTaskRecord),
      total,
    };
  }

  async findPendingOverdue(now: Date, take = 100): Promise<readonly SalesTaskRecord[]> {
    const tasks = await this.prisma.salesTask.findMany({
      where: {
        status: 'PENDING',
        deletedAt: null,
        dueAt: { lt: now },
      },
      include: ownerInclude,
      orderBy: { dueAt: 'asc' },
      take,
    });

    return tasks.map(toSalesTaskRecord);
  }

  async markOverdue(
    id: string,
    data: { readonly updatedAt: Date },
  ): Promise<SalesTaskRecord | null> {
    const result = await this.prisma.salesTask.updateMany({
      where: { id, deletedAt: null, status: 'PENDING' },
      data: {
        status: 'OVERDUE' satisfies SalesTaskStatus,
        updatedAt: data.updatedAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const task = await this.prisma.salesTask.findFirst({
      where: { id },
      include: ownerInclude,
    });

    return task ? toSalesTaskRecord(task) : null;
  }

  async findMeetingsDueSoon(
    now: Date,
    until: Date,
    take = 100,
  ): Promise<readonly SalesTaskRecord[]> {
    const tasks = await this.prisma.salesTask.findMany({
      where: {
        type: 'MEETING',
        status: { in: ['PENDING', 'OVERDUE'] },
        deletedAt: null,
        dueAt: { gte: now, lte: until },
      },
      include: ownerInclude,
      orderBy: { dueAt: 'asc' },
      take,
    });

    return tasks.map(toSalesTaskRecord);
  }
}

const ownerInclude = {
  ownerUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeSalesTaskWhere(scope: SalesTaskScope, id: string) {
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

function toSalesTaskRecord(task: SalesTaskWithOwner): SalesTaskRecord {
  return {
    id: task.id,
    tenantId: task.tenantId,
    workspaceId: task.workspaceId,
    type: task.type,
    title: task.title,
    description: task.description,
    ownerUserId: task.ownerUserId,
    ownerUserDisplayName: resolveUserDisplayName(task.ownerUser),
    ownerUserEmail: task.ownerUser.email,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    dueAt: task.dueAt,
    priority: task.priority,
    leadId: task.leadId,
    dealId: task.dealId,
    clientId: task.clientId,
    status: task.status,
    completedAt: task.completedAt,
    cancelledAt: task.cancelledAt,
    activityId: task.activityId,
    metadata: task.metadata,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    createdByUserId: task.createdByUserId,
    updatedByUserId: task.updatedByUserId,
    deletedAt: task.deletedAt,
    deletedByUserId: task.deletedByUserId,
  };
}
