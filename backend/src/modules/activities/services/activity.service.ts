import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
  CreateActivityCommand,
  ListActivitiesQuery,
} from './activity-application.types';

/**
 * Application service — orchestrates activity use cases and persistence.
 * Activities are append-only records attachable to any entity.
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
      skip: query.skip,
      take: query.take,
    });
  }

  async listActivitiesByEntity(
    scope: ActivityScope,
    entityType: string,
    entityId: string,
    query: Pick<ListActivitiesQuery, 'skip' | 'take'>,
  ): Promise<ListActivitiesResult> {
    return this.activityRepository.listByEntity(scope, entityType, entityId, {
      skip: query.skip,
      take: query.take,
    });
  }

  async createActivity(
    scope: ActivityScope,
    command: CreateActivityCommand,
    context: ActivityApplicationContext,
  ): Promise<ActivityRecord> {
    this.assertCreateCommand(command);

    const now = new Date();
    const data: CreateActivityData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: command.entityType.trim(),
      entityId: command.entityId,
      userId: context.actorUserId || null,
      type: command.type.trim(),
      title: command.title.trim(),
      description: command.description?.trim() ?? null,
      createdAt: now,
      ...(command.metadata !== undefined ? { metadata: command.metadata } : {}),
    };

    return this.activityRepository.create(data);
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
