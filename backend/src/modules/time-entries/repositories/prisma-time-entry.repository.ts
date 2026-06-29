import { Injectable } from '@nestjs/common';
import type { TimeEntry, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateTimeEntryData,
  SoftDeleteTimeEntryData,
  TimeEntryRecord,
  TimeEntryRepository,
  TimeEntryScope,
  TimeEntryTaskScope,
  UpdateTimeEntryData,
} from './time-entry.repository.interface';

type TimeEntryWithUser = TimeEntry & {
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaTimeEntryRepository implements TimeEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTimeEntryData): Promise<TimeEntryRecord> {
    const entry = await this.prisma.timeEntry.create({
      data,
      include: userInclude,
    });

    return toTimeEntryRecord(entry);
  }

  async findById(scope: TimeEntryScope, id: string): Promise<TimeEntryRecord | null> {
    const entry = await this.prisma.timeEntry.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      include: userInclude,
    });

    return entry ? toTimeEntryRecord(entry) : null;
  }

  async findActiveByUser(scope: TimeEntryScope, userId: string): Promise<TimeEntryRecord | null> {
    const entry = await this.prisma.timeEntry.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        isRunning: true,
        deletedAt: null,
      },
      include: userInclude,
      orderBy: { startTime: 'desc' },
    });

    return entry ? toTimeEntryRecord(entry) : null;
  }

  async listByTask(scope: TimeEntryTaskScope): Promise<readonly TimeEntryRecord[]> {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId: scope.taskId,
        isRunning: false,
        deletedAt: null,
      },
      include: userInclude,
      orderBy: { startTime: 'desc' },
    });

    return entries.map(toTimeEntryRecord);
  }

  async update(
    scope: TimeEntryScope,
    id: string,
    data: UpdateTimeEntryData,
  ): Promise<TimeEntryRecord | null> {
    const result = await this.prisma.timeEntry.updateMany({
      where: activeEntryWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: TimeEntryScope,
    id: string,
    data: SoftDeleteTimeEntryData,
  ): Promise<TimeEntryRecord | null> {
    const result = await this.prisma.timeEntry.updateMany({
      where: activeEntryWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }
}

const userInclude = {
  user: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeEntryWhere(scope: TimeEntryScope, id: string) {
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

function toTimeEntryRecord(entry: TimeEntryWithUser): TimeEntryRecord {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    workspaceId: entry.workspaceId,
    taskId: entry.taskId,
    userId: entry.userId,
    userDisplayName: resolveUserDisplayName(entry.user),
    userEmail: entry.user.email,
    startTime: entry.startTime,
    endTime: entry.endTime,
    durationMinutes: entry.durationMinutes,
    isRunning: entry.isRunning,
    billable: entry.billable,
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    createdByUserId: entry.createdByUserId,
    updatedByUserId: entry.updatedByUserId,
    deletedAt: entry.deletedAt,
    deletedByUserId: entry.deletedByUserId,
  };
}
