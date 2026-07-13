import { Inject, Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activities/services/activity.service';
import {
  TASK_REPOSITORY,
  type TaskRepository,
} from '../../tasks/repositories/task.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { TimeEntryDomainService } from '../domain/time-entry-domain.service';
import {
  TIME_ENTRY_DOMAIN_ERROR_CODES,
  TimeEntryDomainError,
} from '../domain/time-entry-domain.errors';
import {
  TIME_ENTRY_REPOSITORY,
  type CreateTimeEntryData,
  type TimeEntryRecord,
  type TimeEntryRepository,
  type TimeEntryScope,
  type UpdateTimeEntryData,
} from '../repositories/time-entry.repository.interface';
import type {
  CreateTimeEntryCommand,
  StartTimeEntryCommand,
  StopTimeEntryCommand,
  TimeEntryApplicationContext,
  UpdateTimeEntryCommand,
} from './time-entry-application.types';

@Injectable()
export class TimeEntryService {
  constructor(
    @Inject(TIME_ENTRY_REPOSITORY)
    private readonly timeEntryRepository: TimeEntryRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
    private readonly timeEntryDomainService: TimeEntryDomainService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async listByTask(scope: TimeEntryScope, taskId: string): Promise<readonly TimeEntryRecord[]> {
    await this.requireTask(scope, taskId);

    return this.timeEntryRepository.listByTask({
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
    });
  }

  async createTimeEntry(
    scope: TimeEntryScope,
    taskId: string,
    command: CreateTimeEntryCommand,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord> {
    await this.requireTask(scope, taskId);

    this.timeEntryDomainService.validateCreate({
      startTime: command.startTime,
      endTime: command.endTime,
    });

    const now = new Date();
    const userId = command.userId ?? context.actorUserId;
    const durationMinutes = this.timeEntryDomainService.computeDurationMinutes(
      command.startTime,
      command.endTime,
    );

    const data: CreateTimeEntryData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
      userId,
      startTime: command.startTime,
      endTime: command.endTime,
      durationMinutes,
      isRunning: false,
      billable: command.billable ?? true,
      notes: this.timeEntryDomainService.normalizeNotes(command.notes),
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const entry = await this.timeEntryRepository.create(data);

      await this.activityService.createActivity(
        scope,
        {
          entityType: 'task',
          entityId: taskId,
          type: ActivityType.CUSTOM,
          title: `${this.timeEntryDomainService.formatLoggedHours(durationMinutes)}h logged`,
          description: entry.notes ?? undefined,
          metadata: {
            timeEntryId: entry.id,
            durationMinutes,
            billable: entry.billable,
          },
        },
        { actorUserId: context.actorUserId },
      );

      return entry;
    });
  }

  async updateTimeEntry(
    scope: TimeEntryScope,
    timeEntryId: string,
    command: UpdateTimeEntryCommand,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord> {
    const existing = await this.requireTimeEntry(scope, timeEntryId);

    this.timeEntryDomainService.validateUpdate(existing, {
      startTime: command.startTime,
      endTime: command.endTime,
    });

    const startTime = command.startTime ?? existing.startTime;
    const endTime = command.endTime ?? existing.endTime;
    const now = new Date();

    const data: UpdateTimeEntryData = {
      ...(command.userId !== undefined ? { userId: command.userId } : {}),
      ...(command.startTime !== undefined ? { startTime: command.startTime } : {}),
      ...(command.endTime !== undefined ? { endTime: command.endTime } : {}),
      ...(command.startTime !== undefined || command.endTime !== undefined
        ? endTime !== null
          ? {
              durationMinutes: this.timeEntryDomainService.computeDurationMinutes(
                startTime,
                endTime,
              ),
            }
          : {}
        : {}),
      ...(command.billable !== undefined ? { billable: command.billable } : {}),
      ...(command.notes !== undefined
        ? { notes: this.timeEntryDomainService.normalizeNotes(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.timeEntryRepository.update(scope, timeEntryId, data);
      if (updated === null) {
        throw new TimeEntryDomainError(
          TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_NOT_FOUND,
          'Time entry was not found.',
        );
      }

      return updated;
    });
  }

  async getActiveTimer(
    scope: TimeEntryScope,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord | null> {
    return this.timeEntryRepository.findActiveByUser(scope, context.actorUserId);
  }

  async startTimer(
    scope: TimeEntryScope,
    taskId: string,
    command: StartTimeEntryCommand,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord> {
    await this.requireTask(scope, taskId);

    const existingActive = await this.timeEntryRepository.findActiveByUser(
      scope,
      context.actorUserId,
    );

    if (existingActive !== null) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.ACTIVE_TIMER_EXISTS,
        'An active timer is already running.',
      );
    }

    const now = new Date();

    const data: CreateTimeEntryData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
      userId: context.actorUserId,
      startTime: now,
      endTime: null,
      durationMinutes: null,
      isRunning: true,
      billable: command.billable ?? true,
      notes: null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.timeEntryRepository.create(data));
  }

  async stopTimer(
    scope: TimeEntryScope,
    timeEntryId: string,
    command: StopTimeEntryCommand,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord> {
    const existing = await this.requireTimeEntry(scope, timeEntryId);

    this.timeEntryDomainService.validateStop(existing);
    this.timeEntryDomainService.ensureTimerActor(existing, context.actorUserId);

    const now = new Date();
    const durationMinutes = this.timeEntryDomainService.computeDurationMinutes(
      existing.startTime,
      now,
    );

    const data: UpdateTimeEntryData = {
      endTime: now,
      durationMinutes,
      isRunning: false,
      ...(command.billable !== undefined ? { billable: command.billable } : {}),
      ...(command.notes !== undefined
        ? { notes: this.timeEntryDomainService.normalizeNotes(command.notes) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.timeEntryRepository.update(scope, timeEntryId, data);
      if (updated === null) {
        throw new TimeEntryDomainError(
          TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_NOT_FOUND,
          'Time entry was not found.',
        );
      }

      await this.activityService.createActivity(
        scope,
        {
          entityType: 'task',
          entityId: updated.taskId,
          type: ActivityType.CUSTOM,
          title: `${this.timeEntryDomainService.formatLoggedHours(durationMinutes)}h logged`,
          description: updated.notes ?? undefined,
          metadata: {
            timeEntryId: updated.id,
            durationMinutes,
            billable: updated.billable,
          },
        },
        { actorUserId: context.actorUserId },
      );

      return updated;
    });
  }

  async deleteTimeEntry(
    scope: TimeEntryScope,
    timeEntryId: string,
    context: TimeEntryApplicationContext,
  ): Promise<TimeEntryRecord> {
    await this.requireTimeEntry(scope, timeEntryId);

    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.timeEntryRepository.softDelete(scope, timeEntryId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new TimeEntryDomainError(
          TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_NOT_FOUND,
          'Time entry was not found.',
        );
      }

      return deleted;
    });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async requireTask(scope: TimeEntryScope, taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(scope, taskId);

    if (task === null) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.TASK_NOT_FOUND,
        'Task was not found.',
      );
    }
  }

  private async requireTimeEntry(
    scope: TimeEntryScope,
    timeEntryId: string,
  ): Promise<TimeEntryRecord> {
    const entry = await this.timeEntryRepository.findById(scope, timeEntryId);

    if (entry?.deletedAt != null || entry == null) {
      throw new TimeEntryDomainError(
        TIME_ENTRY_DOMAIN_ERROR_CODES.TIME_ENTRY_NOT_FOUND,
        'Time entry was not found.',
      );
    }

    this.timeEntryDomainService.ensureWorkspaceOwnership(scope, entry);
    return entry;
  }
}
