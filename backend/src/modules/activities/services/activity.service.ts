import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ActivityOrigin, type ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  ACTIVITY_TYPE_LABELS,
  defaultTitleForType,
  isManualActivityType,
  MANUAL_ACTIVITY_TYPES,
  resolveActivityType,
} from '../domain/activity-type.catalog';
import {
  ACTIVITY_REPOSITORY,
  type ActivityRecord,
  type ActivityRepository,
  type ActivityScope,
  type CreateActivityData,
  type ListActivitiesResult,
} from '../repositories/activity.repository.interface';
import type {
  ActivityApplicationContext,
  ActivityTypesCatalog,
  CreateActivityCommand,
  ListActivitiesQuery,
  LogManualActivityCommand,
  LogSystemEventCommand,
} from './activity-application.types';

/**
 * Application service — orchestrates activity use cases and persistence.
 * Activities are append-only records attachable to any entity.
 * All auto-logs should go through logSystemEvent.
 */
@Injectable()
export class ActivityService {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: ActivityRepository,
  ) {}

  async listActivities(
    scope: ActivityScope,
    query: ListActivitiesQuery,
  ): Promise<ListActivitiesResult> {
    return this.activityRepository.list({
      scope,
      entityType: query.entityType,
      entityId: query.entityId,
      type: query.type,
      types: query.types,
      userId: query.userId,
      origin: query.origin,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      skip: query.skip,
      take: query.take,
    });
  }

  async listActivitiesByEntity(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    query: ListActivitiesQuery = {},
  ): Promise<ListActivitiesResult> {
    return this.activityRepository.listByEntity(scope, entityType, entityId, {
      skip: query.skip,
      take: query.take,
      type: query.type,
      types: query.types,
      userId: query.userId,
      origin: query.origin,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
    });
  }

  /** Timeline alias — newest first (repository default order). */
  async getTimeline(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    query: ListActivitiesQuery = {},
  ): Promise<ListActivitiesResult> {
    return this.listActivitiesByEntity(scope, entityType, entityId, query);
  }

  getActivityTypes(): ActivityTypesCatalog {
    const types = (Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((value) => ({
      value,
      label: ACTIVITY_TYPE_LABELS[value],
      isManual: isManualActivityType(value),
    }));

    return {
      types,
      manualTypes: MANUAL_ACTIVITY_TYPES,
    };
  }

  async createActivity(
    scope: ActivityScope,
    command: CreateActivityCommand,
    context: ActivityApplicationContext,
  ): Promise<ActivityRecord> {
    this.assertCreateCommand(command);

    const type = resolveActivityType(command.type);
    const origin = command.origin ?? ActivityOrigin.SYSTEM;
    const dedupeKey = normalizeOptionalDedupeKey(command.dedupeKey);

    if (dedupeKey !== null) {
      const existing = await this.activityRepository.findByDedupeKey(scope, dedupeKey);
      if (existing !== null) {
        return existing;
      }
    }

    const now = new Date();
    const data: CreateActivityData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: command.entityType.trim(),
      entityId: command.entityId,
      userId: context.actorUserId || null,
      type,
      origin,
      title: command.title.trim(),
      description: command.description?.trim() ?? null,
      createdAt: now,
      dedupeKey,
      ...(command.metadata !== undefined ? { metadata: command.metadata } : {}),
    };

    return this.activityRepository.create(data);
  }

  async logSystemEvent(
    scope: ActivityScope,
    command: LogSystemEventCommand,
    context: ActivityApplicationContext,
  ): Promise<ActivityRecord> {
    if (command.entityType.trim().length === 0) {
      throw new BadRequestException('Entity type is required.');
    }

    const type = resolveActivityType(command.type);
    const dedupeKey = normalizeOptionalDedupeKey(command.dedupeKey);

    if (dedupeKey !== null) {
      const existing = await this.activityRepository.findByDedupeKey(scope, dedupeKey);
      if (existing !== null) {
        return existing;
      }
    }

    const title =
      command.title !== undefined && command.title.trim().length > 0
        ? command.title.trim()
        : defaultTitleForType(type);

    return this.createActivity(
      scope,
      {
        entityType: command.entityType,
        entityId: command.entityId,
        type,
        title,
        description: command.description,
        metadata: command.metadata,
        origin: ActivityOrigin.SYSTEM,
        ...(dedupeKey !== null ? { dedupeKey } : {}),
      },
      context,
    );
  }

  async logManualActivity(
    scope: ActivityScope,
    command: LogManualActivityCommand,
    context: ActivityApplicationContext,
  ): Promise<ActivityRecord> {
    const type = resolveActivityType(command.type);

    if (!isManualActivityType(type)) {
      throw new BadRequestException(`Activity type ${type} is not allowed for manual activities.`);
    }

    return this.createActivity(
      scope,
      {
        entityType: command.entityType,
        entityId: command.entityId,
        type,
        title: command.title,
        description: command.description,
        metadata: command.metadata,
        origin: ActivityOrigin.MANUAL,
        dedupeKey: command.dedupeKey,
      },
      context,
    );
  }

  private assertCreateCommand(command: CreateActivityCommand): void {
    if (command.entityType.trim().length === 0) {
      throw new BadRequestException('Entity type is required.');
    }

    if (command.type.trim().length === 0) {
      throw new BadRequestException('Activity type is required.');
    }

    if (command.title.trim().length === 0) {
      throw new BadRequestException('Activity title is required.');
    }
  }
}

function normalizeOptionalDedupeKey(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
