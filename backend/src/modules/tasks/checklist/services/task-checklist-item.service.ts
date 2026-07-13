import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from '../../domain/task-domain.errors';
import {
  TASK_REPOSITORY,
  type TaskRepository,
  type TaskScope,
} from '../../repositories/task.repository.interface';
import {
  TASK_CHECKLIST_ITEM_REPOSITORY,
  type TaskChecklistItemRecord,
  type TaskChecklistItemRepository,
  type TaskChecklistItemScope,
} from '../repositories/task-checklist-item.repository.interface';
import type {
  CreateTaskChecklistItemCommand,
  TaskChecklistApplicationContext,
  UpdateTaskChecklistItemCommand,
} from './task-checklist-item-application.types';

@Injectable()
export class TaskChecklistItemService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
    @Inject(TASK_CHECKLIST_ITEM_REPOSITORY)
    private readonly checklistRepository: TaskChecklistItemRepository,
  ) {}

  async listItems(scope: TaskScope, taskId: string): Promise<readonly TaskChecklistItemRecord[]> {
    await this.requireTask(scope, taskId);
    return this.checklistRepository.listByTask(this.toChecklistScope(scope, taskId));
  }

  async createItem(
    scope: TaskScope,
    taskId: string,
    command: CreateTaskChecklistItemCommand,
    context: TaskChecklistApplicationContext,
  ): Promise<TaskChecklistItemRecord> {
    await this.requireTask(scope, taskId);

    const title = command.title.trim();
    if (title.length === 0) {
      throw new BadRequestException('Checklist item title is required.');
    }

    const checklistScope = this.toChecklistScope(scope, taskId);
    const sortOrder =
      command.sortOrder ?? (await this.checklistRepository.getNextSortOrder(checklistScope));
    const now = new Date();

    return this.checklistRepository.create({
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
      title,
      isCompleted: command.isCompleted ?? false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    });
  }

  async updateItem(
    scope: TaskScope,
    taskId: string,
    itemId: string,
    command: UpdateTaskChecklistItemCommand,
    context: TaskChecklistApplicationContext,
  ): Promise<TaskChecklistItemRecord> {
    await this.requireTask(scope, taskId);

    if (command.title?.trim().length === 0) {
      throw new BadRequestException('Checklist item title is required.');
    }

    const now = new Date();
    const updated = await this.checklistRepository.update(
      this.toChecklistScope(scope, taskId),
      itemId,
      {
        ...(command.title !== undefined ? { title: command.title.trim() } : {}),
        ...(command.isCompleted !== undefined ? { isCompleted: command.isCompleted } : {}),
        ...(command.sortOrder !== undefined ? { sortOrder: command.sortOrder } : {}),
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      },
    );

    if (updated === null) {
      throw new NotFoundException('Checklist item was not found.');
    }

    return updated;
  }

  async deleteItem(
    scope: TaskScope,
    taskId: string,
    itemId: string,
    context: TaskChecklistApplicationContext,
  ): Promise<TaskChecklistItemRecord> {
    await this.requireTask(scope, taskId);
    const now = new Date();

    const deleted = await this.checklistRepository.softDelete(
      this.toChecklistScope(scope, taskId),
      itemId,
      {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      },
    );

    if (deleted === null) {
      throw new NotFoundException('Checklist item was not found.');
    }

    return deleted;
  }

  private toChecklistScope(scope: TaskScope, taskId: string): TaskChecklistItemScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      taskId,
    };
  }

  private async requireTask(scope: TaskScope, taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(scope, taskId);
    if (task === null) {
      throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
    }
  }
}
