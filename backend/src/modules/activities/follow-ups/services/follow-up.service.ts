import { Inject, Injectable } from '@nestjs/common';
import { ActivityType, type FollowUpReminderType, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../services/activity.service';
import { FollowUpDomainService } from '../domain/follow-up-domain.service';
import {
  FOLLOW_UP_DOMAIN_ERROR_CODES,
  FollowUpDomainError,
} from '../domain/follow-up-domain.errors';
import {
  FOLLOW_UP_REPOSITORY,
  type CreateFollowUpData,
  type FollowUpRecord,
  type FollowUpRepository,
  type UpdateFollowUpData,
} from '../repositories/follow-up.repository.interface';
import type {
  CreateFollowUpCommand,
  FollowUpApplicationContext,
  FollowUpDashboardSummary,
  FollowUpScope,
  ListFollowUpsQuery,
  ListFollowUpsResult,
  UpdateFollowUpCommand,
} from './follow-up-application.types';

const DASHBOARD_ITEM_TAKE = 10;

@Injectable()
export class FollowUpService {
  constructor(
    @Inject(FOLLOW_UP_REPOSITORY)
    private readonly followUpRepository: FollowUpRepository,
    private readonly followUpDomainService: FollowUpDomainService,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async createFollowUp(
    scope: FollowUpScope,
    command: CreateFollowUpCommand,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    this.followUpDomainService.validateCreate({
      title: command.title,
      followUpDate: command.followUpDate,
      followUpTime: command.followUpTime,
      assignedUserId: command.assignedUserId,
      entityType: command.entityType,
      entityId: command.entityId,
    });

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const scheduledAt = this.followUpDomainService.computeScheduledAt(
      command.followUpDate,
      command.followUpTime,
    );
    const followUpDate = this.followUpDomainService.parseFollowUpDate(command.followUpDate);

    const data: CreateFollowUpData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: this.followUpDomainService.normalizeRequiredString(command.entityType),
      entityId: command.entityId,
      title: this.followUpDomainService.normalizeRequiredString(command.title),
      description: this.followUpDomainService.normalizeOptionalString(command.description) ?? null,
      followUpDate,
      followUpTime: command.followUpTime,
      scheduledAt,
      priority: command.priority ?? 'MEDIUM',
      assignedUserId: command.assignedUserId,
      reminderType: command.reminderType,
      recurrence: command.recurrence ?? 'NONE',
      status: 'PENDING',
      metadata: toJsonValue(command.metadata),
      createdAt: now,
      updatedAt: now,
      createdByUserId: actorUserId,
      updatedByUserId: actorUserId,
    };

    const created = await this.runInTransaction(() => this.followUpRepository.create(data));

    const activityType = mapReminderTypeToActivityType(created.reminderType);
    const activity = await this.activityService.logSystemEvent(
      scope,
      {
        entityType: created.entityType,
        entityId: created.entityId,
        type: activityType,
        title: `Follow-up scheduled: ${created.title}`,
        description: created.description ?? undefined,
        dedupeKey: `follow_up.created:${created.id}`,
        metadata: {
          followUpId: created.id,
          reminderType: created.reminderType,
          scheduledAt: created.scheduledAt.toISOString(),
        },
      },
      { actorUserId: actorUserId ?? '' },
    );

    const linked = await this.followUpRepository.update(scope, created.id, {
      activityId: activity.id,
      updatedAt: new Date(),
      updatedByUserId: actorUserId,
    });

    return linked ?? created;
  }

  async listFollowUps(
    scope: FollowUpScope,
    query: ListFollowUpsQuery,
  ): Promise<ListFollowUpsResult> {
    return this.followUpRepository.list({
      scope,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
      status: query.status,
      assignedUserId: query.assignedUserId,
      entityType: query.entityType,
      entityId: query.entityId,
      from: query.from,
      to: query.to,
    });
  }

  async getFollowUp(scope: FollowUpScope, id: string): Promise<FollowUpRecord> {
    return this.requireFollowUp(scope, id);
  }

  async updateFollowUp(
    scope: FollowUpScope,
    id: string,
    command: UpdateFollowUpCommand,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    const existing = await this.requireFollowUp(scope, id);
    this.followUpDomainService.validateUpdate(existing, {
      title: command.title,
      followUpDate: command.followUpDate,
      followUpTime: command.followUpTime,
      assignedUserId: command.assignedUserId,
    });

    const actorUserId = normalizeActorUserId(context.actorUserId);
    const now = new Date();

    const nextDate = command.followUpDate ?? formatDateOnlyUtc(existing.followUpDate);
    const nextTime = command.followUpTime ?? existing.followUpTime;
    const scheduledAt = this.followUpDomainService.computeScheduledAt(nextDate, nextTime);

    const data: UpdateFollowUpData = {
      ...(command.title !== undefined
        ? { title: this.followUpDomainService.normalizeRequiredString(command.title) }
        : {}),
      ...(command.description !== undefined
        ? {
            description:
              this.followUpDomainService.normalizeOptionalString(command.description) ?? null,
          }
        : {}),
      ...(command.followUpDate !== undefined
        ? { followUpDate: this.followUpDomainService.parseFollowUpDate(command.followUpDate) }
        : {}),
      ...(command.followUpTime !== undefined ? { followUpTime: command.followUpTime } : {}),
      scheduledAt,
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.assignedUserId !== undefined ? { assignedUserId: command.assignedUserId } : {}),
      ...(command.reminderType !== undefined ? { reminderType: command.reminderType } : {}),
      ...(command.recurrence !== undefined ? { recurrence: command.recurrence } : {}),
      ...(command.metadata !== undefined ? { metadata: toJsonValue(command.metadata) } : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    const updated = await this.runInTransaction(() =>
      this.followUpRepository.update(scope, id, data),
    );

    if (updated === null) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.FOLLOW_UP_NOT_FOUND,
        'Follow-up was not found.',
      );
    }

    return updated;
  }

  async completeFollowUp(
    scope: FollowUpScope,
    id: string,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    const existing = await this.requireFollowUp(scope, id);
    if (existing.status === 'COMPLETED') {
      return existing;
    }

    const actorUserId = normalizeActorUserId(context.actorUserId);
    const now = new Date();

    const updated = await this.followUpRepository.update(scope, id, {
      status: 'COMPLETED',
      completedAt: now,
      updatedAt: now,
      updatedByUserId: actorUserId,
    });

    if (updated === null) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.FOLLOW_UP_NOT_FOUND,
        'Follow-up was not found.',
      );
    }

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: updated.entityType,
        entityId: updated.entityId,
        type: ActivityType.FOLLOW_UP,
        title: 'Follow-up completed',
        description: updated.title,
        dedupeKey: `follow_up.completed:${updated.id}`,
        metadata: { followUpId: updated.id },
      },
      { actorUserId: actorUserId ?? '' },
    );

    return updated;
  }

  async cancelFollowUp(
    scope: FollowUpScope,
    id: string,
    context: FollowUpApplicationContext,
  ): Promise<FollowUpRecord> {
    const existing = await this.requireFollowUp(scope, id);
    if (existing.status === 'CANCELLED') {
      return existing;
    }

    const actorUserId = normalizeActorUserId(context.actorUserId);
    const now = new Date();

    const updated = await this.followUpRepository.update(scope, id, {
      status: 'CANCELLED',
      updatedAt: now,
      updatedByUserId: actorUserId,
    });

    if (updated === null) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.FOLLOW_UP_NOT_FOUND,
        'Follow-up was not found.',
      );
    }

    return updated;
  }

  async getDashboardSummary(scope: FollowUpScope): Promise<FollowUpDashboardSummary> {
    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    const endOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
    );

    const [todays, pendingOverdue, missed, completedToday, upcomingMeetings, recentActivity] =
      await Promise.all([
        this.followUpRepository.list({
          scope,
          status: 'PENDING',
          from: startOfToday,
          to: endOfToday,
          take: DASHBOARD_ITEM_TAKE,
        }),
        this.followUpRepository.list({
          scope,
          status: 'PENDING',
          to: now,
          take: DASHBOARD_ITEM_TAKE,
        }),
        this.followUpRepository.list({
          scope,
          status: 'MISSED',
          take: DASHBOARD_ITEM_TAKE,
        }),
        this.followUpRepository.list({
          scope,
          status: 'COMPLETED',
          completedFrom: startOfToday,
          completedTo: endOfToday,
          take: DASHBOARD_ITEM_TAKE,
        }),
        this.followUpRepository.list({
          scope,
          status: 'PENDING',
          reminderType: 'MEETING',
          from: now,
          take: DASHBOARD_ITEM_TAKE,
        }),
        this.activityService.listActivities(scope, { take: DASHBOARD_ITEM_TAKE }),
      ]);

    const overdueItems = [...pendingOverdue.items, ...missed.items]
      .filter(
        (item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index,
      )
      .slice(0, DASHBOARD_ITEM_TAKE);
    const overdueCount = pendingOverdue.total + missed.total;

    return {
      todaysFollowUps: { count: todays.total, items: todays.items },
      overdueFollowUps: { count: overdueCount, items: overdueItems },
      completedToday: { count: completedToday.total, items: completedToday.items },
      upcomingMeetings: { count: upcomingMeetings.total, items: upcomingMeetings.items },
      recentActivity: { count: recentActivity.total, items: recentActivity.items },
    };
  }

  private async requireFollowUp(scope: FollowUpScope, id: string): Promise<FollowUpRecord> {
    const followUp = await this.followUpRepository.findById(scope, id);

    if (followUp === null) {
      throw new FollowUpDomainError(
        FOLLOW_UP_DOMAIN_ERROR_CODES.FOLLOW_UP_NOT_FOUND,
        'Follow-up was not found.',
      );
    }

    return followUp;
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }
}

function mapReminderTypeToActivityType(reminderType: FollowUpReminderType): ActivityType {
  switch (reminderType) {
    case 'CALL':
      return ActivityType.CALL;
    case 'EMAIL':
      return ActivityType.EMAIL;
    case 'WHATSAPP':
      return ActivityType.WHATSAPP;
    case 'MEETING':
      return ActivityType.MEETING;
    case 'FOLLOW_UP':
      return ActivityType.FOLLOW_UP;
    case 'CUSTOM':
    default:
      return ActivityType.CUSTOM;
  }
}

function normalizeActorUserId(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  return value;
}

function formatDateOnlyUtc(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toJsonValue(
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value;
}
