import { Injectable } from '@nestjs/common';
import { Prisma, type FollowUp, type User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateFollowUpData,
  FollowUpRecord,
  FollowUpRepository,
  FollowUpScope,
  ListFollowUpsParams,
  ListFollowUpsResult,
  SoftDeleteFollowUpData,
  UpdateFollowUpData,
} from './follow-up.repository.interface';

type FollowUpWithAssignee = FollowUp & {
  assignedUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

const assigneeInclude = {
  assignedUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class PrismaEntityFollowUpRepository implements FollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFollowUpData): Promise<FollowUpRecord> {
    const followUp = await this.prisma.followUp.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        entityType: data.entityType,
        entityId: data.entityId,
        title: data.title,
        description: data.description ?? null,
        followUpDate: data.followUpDate,
        followUpTime: data.followUpTime,
        scheduledAt: data.scheduledAt,
        priority: data.priority ?? 'MEDIUM',
        assignedUserId: data.assignedUserId,
        reminderType: data.reminderType,
        status: data.status ?? 'PENDING',
        recurrence: data.recurrence ?? 'NONE',
        activityId: data.activityId ?? null,
        ...(data.metadata !== undefined ? { metadata: data.metadata ?? Prisma.JsonNull } : {}),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: assigneeInclude,
    });

    return toFollowUpRecord(followUp);
  }

  async update(
    scope: FollowUpScope,
    id: string,
    data: UpdateFollowUpData,
  ): Promise<FollowUpRecord | null> {
    const result = await this.prisma.followUp.updateMany({
      where: activeFollowUpWhere(scope, id),
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.followUpDate !== undefined ? { followUpDate: data.followUpDate } : {}),
        ...(data.followUpTime !== undefined ? { followUpTime: data.followUpTime } : {}),
        ...(data.scheduledAt !== undefined ? { scheduledAt: data.scheduledAt } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assignedUserId !== undefined ? { assignedUserId: data.assignedUserId } : {}),
        ...(data.reminderType !== undefined ? { reminderType: data.reminderType } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
        ...(data.completedAt !== undefined ? { completedAt: data.completedAt } : {}),
        ...(data.missedAt !== undefined ? { missedAt: data.missedAt } : {}),
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
    scope: FollowUpScope,
    id: string,
    data: SoftDeleteFollowUpData,
  ): Promise<FollowUpRecord | null> {
    const result = await this.prisma.followUp.updateMany({
      where: activeFollowUpWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const followUp = await this.prisma.followUp.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
      include: assigneeInclude,
    });

    return followUp ? toFollowUpRecord(followUp) : null;
  }

  async findById(scope: FollowUpScope, id: string): Promise<FollowUpRecord | null> {
    const followUp = await this.prisma.followUp.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: assigneeInclude,
    });

    return followUp ? toFollowUpRecord(followUp) : null;
  }

  async list(params: ListFollowUpsParams): Promise<ListFollowUpsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      entityType,
      entityId,
      status,
      assignedUserId,
      from,
      to,
      completedFrom,
      completedTo,
      reminderType,
    } = params;

    const where: Prisma.FollowUpWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(reminderType !== undefined ? { reminderType } : {}),
      ...(from !== undefined || to !== undefined
        ? {
            scheduledAt: {
              ...(from !== undefined ? { gte: from } : {}),
              ...(to !== undefined ? { lte: to } : {}),
            },
          }
        : {}),
      ...(completedFrom !== undefined || completedTo !== undefined
        ? {
            completedAt: {
              ...(completedFrom !== undefined ? { gte: completedFrom } : {}),
              ...(completedTo !== undefined ? { lte: completedTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.followUp.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip,
        take,
        include: assigneeInclude,
      }),
      this.prisma.followUp.count({ where }),
    ]);

    return {
      items: items.map(toFollowUpRecord),
      total,
    };
  }

  async findPendingOverdue(now: Date, take = 100): Promise<readonly FollowUpRecord[]> {
    const items = await this.prisma.followUp.findMany({
      where: {
        deletedAt: null,
        status: 'PENDING',
        scheduledAt: { lt: now },
      },
      orderBy: { scheduledAt: 'asc' },
      take,
      include: assigneeInclude,
    });

    return items.map(toFollowUpRecord);
  }

  async markMissed(
    id: string,
    data: { readonly missedAt: Date; readonly updatedAt: Date },
  ): Promise<FollowUpRecord | null> {
    const result = await this.prisma.followUp.updateMany({
      where: {
        id,
        deletedAt: null,
        status: 'PENDING',
      },
      data: {
        status: 'MISSED',
        missedAt: data.missedAt,
        updatedAt: data.updatedAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const followUp = await this.prisma.followUp.findFirst({
      where: { id },
      include: assigneeInclude,
    });

    return followUp ? toFollowUpRecord(followUp) : null;
  }
}

function activeFollowUpWhere(scope: FollowUpScope, id: string): Prisma.FollowUpWhereInput {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toFollowUpRecord(followUp: FollowUpWithAssignee): FollowUpRecord {
  return {
    id: followUp.id,
    tenantId: followUp.tenantId,
    workspaceId: followUp.workspaceId,
    entityType: followUp.entityType,
    entityId: followUp.entityId,
    title: followUp.title,
    description: followUp.description,
    followUpDate: followUp.followUpDate,
    followUpTime: followUp.followUpTime,
    scheduledAt: followUp.scheduledAt,
    priority: followUp.priority,
    assignedUserId: followUp.assignedUserId,
    assignedUserDisplayName: resolveUserDisplayName(followUp.assignedUser),
    assignedUserEmail: followUp.assignedUser.email,
    reminderType: followUp.reminderType,
    status: followUp.status,
    recurrence: followUp.recurrence,
    completedAt: followUp.completedAt,
    missedAt: followUp.missedAt,
    activityId: followUp.activityId,
    metadata: followUp.metadata,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
    createdByUserId: followUp.createdByUserId,
    updatedByUserId: followUp.updatedByUserId,
    deletedAt: followUp.deletedAt,
    deletedByUserId: followUp.deletedByUserId,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string | null {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName]
    .filter((part): part is string => part !== null && part.trim().length > 0)
    .join(' ')
    .trim();

  if (name.length > 0) {
    return name;
  }

  return user.email;
}
