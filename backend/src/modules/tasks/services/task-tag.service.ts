import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from '../domain/task-domain.errors';
import {
  TASK_REPOSITORY,
  TASK_TAG_REPOSITORY,
  type TaskRepository,
  type TaskScope,
  type TaskTagRecord,
  type TaskTagRepository,
  type TaskTagScope,
} from '../repositories/task.repository.interface';
import type {
  AssignTaskTagCommand,
  TaskTagApplicationContext,
  TaskTagResponse,
} from './task-tag-application.types';

@Injectable()
export class TaskTagService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
    @Inject(TASK_TAG_REPOSITORY)
    private readonly taskTagRepository: TaskTagRepository,
  ) {}

  async listTags(scope: TaskScope, taskId: string): Promise<readonly TaskTagResponse[]> {
    await this.requireTask(scope, taskId);
    const tags = await this.taskTagRepository.listByTask(this.toTagScope(scope, taskId));
    return tags.map(toTaskTagResponse);
  }

  async assignTag(
    scope: TaskScope,
    taskId: string,
    command: AssignTaskTagCommand,
    context: TaskTagApplicationContext,
  ): Promise<TaskTagResponse> {
    await this.requireTask(scope, taskId);

    const name = command.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Tag name is required.');
    }

    const tagScope = this.toTagScope(scope, taskId);
    const now = new Date();

    let tag = await this.taskTagRepository.findTagByName(scope, name);
    tag ??= await this.taskTagRepository.createTag(scope, {
      id: randomUUID(),
      name,
      colorToken: command.colorToken ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId || null,
      updatedByUserId: context.actorUserId || null,
    });

    const alreadyAssigned = await this.taskTagRepository.isAssigned(tagScope, tag.id);
    if (alreadyAssigned) {
      const existing = (await this.taskTagRepository.listByTask(tagScope)).find(
        (item) => item.id === tag.id,
      );
      if (existing !== undefined) {
        return toTaskTagResponse(existing);
      }
    }

    const assigned = await this.taskTagRepository.assign(tagScope, tag.id, now);
    return toTaskTagResponse(assigned);
  }

  async unassignTag(scope: TaskScope, taskId: string, tagId: string): Promise<void> {
    await this.requireTask(scope, taskId);
    const removed = await this.taskTagRepository.unassign(this.toTagScope(scope, taskId), tagId);

    if (!removed) {
      throw new NotFoundException('Tag assignment was not found.');
    }
  }

  private async requireTask(scope: TaskScope, taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(scope, taskId, {
      includeArchived: true,
    });

    if (task === null) {
      throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
    }
  }

  private toTagScope(scope: TaskScope, taskId: string): TaskTagScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
    };
  }
}

function toTaskTagResponse(tag: TaskTagRecord): TaskTagResponse {
  return {
    id: tag.id,
    name: tag.name,
    colorToken: tag.colorToken,
    description: tag.description,
    assignedAt: tag.assignedAt.toISOString(),
  };
}
