import { Injectable } from '@nestjs/common';
import { Prisma, type Reminder, type ReminderStatus, type User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateReminderData,
  ListRemindersParams,
  ListRemindersResult,
  ReminderRecord,
  ReminderRepository,
  ReminderScope,
  SoftDeleteReminderData,
  UpdateReminderData,
} from './reminder.repository.interface';

type ReminderWithAssignee = Reminder & {
  assignedUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaReminderRepository implements ReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReminderData): Promise<ReminderRecord> {
    const reminder = await this.prisma.reminder.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        title: data.title,
        body: data.body ?? null,
        remindDate: data.remindDate,
        remindTime: data.remindTime,
        remindAt: data.remindAt,
        recurrence: data.recurrence ?? 'NONE',
        assignedUserId: data.assignedUserId,
        notificationEventKey: data.notificationEventKey,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        status: data.status ?? 'PENDING',
        metadata: data.metadata === undefined ? undefined : (data.metadata ?? Prisma.JsonNull),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: assigneeInclude,
    });

    return toReminderRecord(reminder);
  }

  async update(
    scope: ReminderScope,
    id: string,
    data: UpdateReminderData,
  ): Promise<ReminderRecord | null> {
    const result = await this.prisma.reminder.updateMany({
      where: activeReminderWhere(scope, id),
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(data.remindDate !== undefined ? { remindDate: data.remindDate } : {}),
        ...(data.remindTime !== undefined ? { remindTime: data.remindTime } : {}),
        ...(data.remindAt !== undefined ? { remindAt: data.remindAt } : {}),
        ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
        ...(data.assignedUserId !== undefined ? { assignedUserId: data.assignedUserId } : {}),
        ...(data.notificationEventKey !== undefined
          ? { notificationEventKey: data.notificationEventKey }
          : {}),
        ...(data.entityType !== undefined ? { entityType: data.entityType } : {}),
        ...(data.entityId !== undefined ? { entityId: data.entityId } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.lastFiredAt !== undefined ? { lastFiredAt: data.lastFiredAt } : {}),
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
    scope: ReminderScope,
    id: string,
    data: SoftDeleteReminderData,
  ): Promise<ReminderRecord | null> {
    const result = await this.prisma.reminder.updateMany({
      where: activeReminderWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    const reminder = await this.prisma.reminder.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
      include: assigneeInclude,
    });

    return reminder ? toReminderRecord(reminder) : null;
  }

  async findById(scope: ReminderScope, id: string): Promise<ReminderRecord | null> {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: assigneeInclude,
    });

    return reminder ? toReminderRecord(reminder) : null;
  }

  async list(params: ListRemindersParams): Promise<ListRemindersResult> {
    const { scope, skip = 0, take = 25, status, assignedUserId, entityType, entityId } = params;

    const where: Prisma.ReminderWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
      ...(assignedUserId !== undefined ? { assignedUserId } : {}),
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.reminder.count({ where }),
      this.prisma.reminder.findMany({
        where,
        skip,
        take,
        include: assigneeInclude,
        orderBy: { remindAt: 'asc' },
      }),
    ]);

    return {
      items: items.map(toReminderRecord),
      total,
    };
  }

  async findDue(now: Date, take = 100): Promise<readonly ReminderRecord[]> {
    const reminders = await this.prisma.reminder.findMany({
      where: {
        status: 'PENDING',
        deletedAt: null,
        remindAt: { lte: now },
      },
      include: assigneeInclude,
      orderBy: { remindAt: 'asc' },
      take,
    });

    return reminders.map(toReminderRecord);
  }

  async markFired(
    id: string,
    data: {
      readonly status: ReminderStatus;
      readonly lastFiredAt: Date;
      readonly remindAt?: Date;
      readonly remindDate?: Date;
      readonly updatedAt: Date;
    },
  ): Promise<ReminderRecord | null> {
    const result = await this.prisma.reminder.updateMany({
      where: { id, deletedAt: null, status: 'PENDING' },
      data: {
        status: data.status,
        lastFiredAt: data.lastFiredAt,
        ...(data.remindAt !== undefined ? { remindAt: data.remindAt } : {}),
        ...(data.remindDate !== undefined ? { remindDate: data.remindDate } : {}),
        updatedAt: data.updatedAt,
      },
    });

    if (result.count === 0) {
      return null;
    }

    const reminder = await this.prisma.reminder.findFirst({
      where: { id },
      include: assigneeInclude,
    });

    return reminder ? toReminderRecord(reminder) : null;
  }
}

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

function activeReminderWhere(scope: ReminderScope, id: string) {
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

function toReminderRecord(reminder: ReminderWithAssignee): ReminderRecord {
  return {
    id: reminder.id,
    tenantId: reminder.tenantId,
    workspaceId: reminder.workspaceId,
    title: reminder.title,
    body: reminder.body,
    remindDate: reminder.remindDate,
    remindTime: reminder.remindTime,
    remindAt: reminder.remindAt,
    recurrence: reminder.recurrence,
    assignedUserId: reminder.assignedUserId,
    assignedUserDisplayName: resolveUserDisplayName(reminder.assignedUser),
    assignedUserEmail: reminder.assignedUser.email,
    notificationEventKey: reminder.notificationEventKey,
    entityType: reminder.entityType,
    entityId: reminder.entityId,
    status: reminder.status,
    lastFiredAt: reminder.lastFiredAt,
    metadata: reminder.metadata,
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
    createdByUserId: reminder.createdByUserId,
    updatedByUserId: reminder.updatedByUserId,
    deletedAt: reminder.deletedAt,
    deletedByUserId: reminder.deletedByUserId,
  };
}
