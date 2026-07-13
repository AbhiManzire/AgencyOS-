import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReminderDomainService } from '../domain/reminder-domain.service';
import { REMINDER_DOMAIN_ERROR_CODES, ReminderDomainError } from '../domain/reminder-domain.errors';
import {
  REMINDER_REPOSITORY,
  type CreateReminderData,
  type ReminderRepository,
  type UpdateReminderData,
} from '../repositories/reminder.repository.interface';
import type {
  CreateReminderCommand,
  ListRemindersQuery,
  ListRemindersResult,
  ReminderApplicationContext,
  ReminderRecord,
  ReminderScope,
  UpdateReminderCommand,
} from './reminder-application.types';

@Injectable()
export class ReminderService {
  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: ReminderRepository,
    private readonly reminderDomainService: ReminderDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createReminder(
    scope: ReminderScope,
    command: CreateReminderCommand,
    context: ReminderApplicationContext,
  ): Promise<ReminderRecord> {
    this.reminderDomainService.validateCreate({
      title: command.title,
      remindDate: command.remindDate,
      remindTime: command.remindTime,
      recurrence: command.recurrence,
      assignedUserId: command.assignedUserId,
      notificationEventKey: command.notificationEventKey,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const remindAt = this.reminderDomainService.computeRemindAt(
      command.remindDate,
      command.remindTime,
    );
    const remindDate = this.reminderDomainService.parseRemindDate(command.remindDate);

    const data: CreateReminderData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      title: this.reminderDomainService.normalizeRequiredString(command.title),
      body: this.reminderDomainService.normalizeOptionalString(command.body) ?? null,
      remindDate,
      remindTime: command.remindTime,
      remindAt,
      recurrence: command.recurrence ?? 'NONE',
      assignedUserId: command.assignedUserId,
      notificationEventKey: this.reminderDomainService.normalizeRequiredString(
        command.notificationEventKey,
      ),
      entityType: this.reminderDomainService.normalizeOptionalString(command.entityType) ?? null,
      entityId: command.entityId ?? null,
      status: 'PENDING',
      metadata: toJsonValue(command.metadata),
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    return this.runInTransaction(() => this.reminderRepository.create(data));
  }

  async listReminders(
    scope: ReminderScope,
    query: ListRemindersQuery,
  ): Promise<ListRemindersResult> {
    return this.reminderRepository.list({
      scope,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
      status: query.status,
      assignedUserId: query.assignedUserId,
      entityType: query.entityType,
      entityId: query.entityId,
    });
  }

  async getReminder(scope: ReminderScope, id: string): Promise<ReminderRecord> {
    const reminder = await this.reminderRepository.findById(scope, id);

    if (reminder === null) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.REMINDER_NOT_FOUND,
        'Reminder was not found.',
      );
    }

    return reminder;
  }

  async updateReminder(
    scope: ReminderScope,
    id: string,
    command: UpdateReminderCommand,
    context: ReminderApplicationContext,
  ): Promise<ReminderRecord> {
    const existing = await this.requireReminder(scope, id);

    this.reminderDomainService.validateUpdate(existing, {
      title: command.title,
      remindDate: command.remindDate,
      remindTime: command.remindTime,
      recurrence: command.recurrence,
      assignedUserId: command.assignedUserId,
      notificationEventKey: command.notificationEventKey,
      status: command.status,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    const remindDateStr = command.remindDate ?? formatDateOnlyUtc(existing.remindDate);
    const remindTime = command.remindTime ?? existing.remindTime;
    const shouldRecomputeRemindAt =
      command.remindDate !== undefined || command.remindTime !== undefined;

    const data: UpdateReminderData = {
      ...(command.title !== undefined
        ? { title: this.reminderDomainService.normalizeRequiredString(command.title) }
        : {}),
      ...(command.body !== undefined
        ? { body: this.reminderDomainService.normalizeOptionalString(command.body) ?? null }
        : {}),
      ...(command.remindDate !== undefined
        ? { remindDate: this.reminderDomainService.parseRemindDate(command.remindDate) }
        : {}),
      ...(command.remindTime !== undefined ? { remindTime: command.remindTime } : {}),
      ...(shouldRecomputeRemindAt
        ? {
            remindAt: this.reminderDomainService.computeRemindAt(remindDateStr, remindTime),
          }
        : {}),
      ...(command.recurrence !== undefined ? { recurrence: command.recurrence } : {}),
      ...(command.assignedUserId !== undefined ? { assignedUserId: command.assignedUserId } : {}),
      ...(command.notificationEventKey !== undefined
        ? {
            notificationEventKey: this.reminderDomainService.normalizeRequiredString(
              command.notificationEventKey,
            ),
          }
        : {}),
      ...(command.entityType !== undefined
        ? {
            entityType:
              this.reminderDomainService.normalizeOptionalString(command.entityType) ?? null,
          }
        : {}),
      ...(command.entityId !== undefined ? { entityId: command.entityId } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.metadata !== undefined ? { metadata: toJsonValue(command.metadata) } : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.reminderRepository.update(scope, id, data);

      if (updated === null) {
        throw new ReminderDomainError(
          REMINDER_DOMAIN_ERROR_CODES.REMINDER_NOT_FOUND,
          'Reminder was not found.',
        );
      }

      return updated;
    });
  }

  async deleteReminder(
    scope: ReminderScope,
    id: string,
    context: ReminderApplicationContext,
  ): Promise<ReminderRecord> {
    await this.requireReminder(scope, id);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    return this.runInTransaction(async () => {
      const deleted = await this.reminderRepository.softDelete(scope, id, {
        status: 'CANCELLED',
        deletedAt: now,
        deletedByUserId: actorUserId,
        updatedAt: now,
        updatedByUserId: actorUserId,
      });

      if (deleted === null) {
        throw new ReminderDomainError(
          REMINDER_DOMAIN_ERROR_CODES.REMINDER_NOT_FOUND,
          'Reminder was not found.',
        );
      }

      return deleted;
    });
  }

  private async requireReminder(scope: ReminderScope, id: string): Promise<ReminderRecord> {
    const reminder = await this.reminderRepository.findById(scope, id);

    if (reminder === null) {
      throw new ReminderDomainError(
        REMINDER_DOMAIN_ERROR_CODES.REMINDER_NOT_FOUND,
        'Reminder was not found.',
      );
    }

    return reminder;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function normalizeActorUserId(actorUserId: string): string | null {
  const trimmed = actorUserId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatDateOnlyUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
}

function toJsonValue(
  metadata: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | null | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  if (metadata === null) {
    return null;
  }
  return metadata as Prisma.InputJsonValue;
}
