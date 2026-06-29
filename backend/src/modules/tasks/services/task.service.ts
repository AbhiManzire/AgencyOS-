import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TaskDomainService } from '../domain/task-domain.service';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from '../domain/task-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TASK_REPOSITORY,
  type CreateTaskData,
  type FindTaskByIdOptions,
  type TaskRepository,
  type TaskScope,
  type UpdateTaskData,
} from '../repositories/task.repository.interface';
import type {
  CreateSubtaskCommand,
  CreateTaskCommand,
  GetTaskOptions,
  ListTasksQuery,
  ListTasksResult,
  TaskApplicationContext,
  TaskRecord,
  UpdateSubtaskCommand,
  UpdateTaskCommand,
} from './task-application.types';

@Injectable()
export class TaskService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
    private readonly taskDomainService: TaskDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createTask(
    scope: TaskScope,
    command: CreateTaskCommand,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    await this.taskDomainService.validateCreate(scope, {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      title: command.title,
      projectId: command.projectId,
      milestoneId: command.milestoneId,
      status: command.status,
      priority: command.priority,
      assigneeUserId: command.assigneeUserId,
      startDate: command.startDate,
      dueDate: command.dueDate,
      estimatedHours: command.estimatedHours,
    });

    const now = new Date();

    const data: CreateTaskData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: command.projectId,
      milestoneId: command.milestoneId ?? null,
      parentTaskId: null,
      title: command.title.trim(),
      description: command.description ?? null,
      status: command.status ?? 'TODO',
      priority: command.priority ?? 'NORMAL',
      assigneeUserId: command.assigneeUserId ?? null,
      startDate: command.startDate ?? null,
      dueDate: command.dueDate ?? null,
      estimatedHours: command.estimatedHours ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.taskRepository.create(data));
  }

  async updateTask(
    scope: TaskScope,
    taskId: string,
    command: UpdateTaskCommand,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    const existing = await this.requireTask(scope, taskId, { includeArchived: true });

    await this.taskDomainService.validateUpdate(scope, existing, {
      title: command.title,
      milestoneId: command.milestoneId,
      status: command.status,
      priority: command.priority,
      assigneeUserId: command.assigneeUserId,
      startDate: command.startDate,
      dueDate: command.dueDate,
      estimatedHours: command.estimatedHours,
    });

    const now = new Date();
    const data: UpdateTaskData = {
      ...(command.title !== undefined ? { title: command.title.trim() } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.milestoneId !== undefined ? { milestoneId: command.milestoneId } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.assigneeUserId !== undefined ? { assigneeUserId: command.assigneeUserId } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.estimatedHours !== undefined ? { estimatedHours: command.estimatedHours } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.taskRepository.update(scope, taskId, data);
      if (updated === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
      }

      return updated;
    });
  }

  async getTask(
    scope: TaskScope,
    taskId: string,
    options: GetTaskOptions = {},
  ): Promise<TaskRecord> {
    const task = await this.taskRepository.findById(scope, taskId, {
      includeArchived: options.includeArchived,
    });

    if (task === null) {
      throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
    }

    this.taskDomainService.ensureWorkspaceOwnership(scope, task);
    return task;
  }

  async listTasks(scope: TaskScope, query: ListTasksQuery = {}): Promise<ListTasksResult> {
    return this.taskRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      projectId: query.projectId,
      milestoneId: query.milestoneId,
      status: query.status,
      assigneeUserId: query.assigneeUserId,
      includeArchived: query.includeArchived,
      topLevelOnly: true,
    });
  }

  async listSubtasks(scope: TaskScope, parentTaskId: string): Promise<readonly TaskRecord[]> {
    await this.requireParentTask(scope, parentTaskId);

    const result = await this.taskRepository.list({
      scope,
      parentTaskId,
      topLevelOnly: false,
      take: 100,
    });

    return result.items;
  }

  async createSubtask(
    scope: TaskScope,
    parentTaskId: string,
    command: CreateSubtaskCommand,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    const parentTask = await this.requireParentTask(scope, parentTaskId);

    await this.taskDomainService.validateCreateSubtask(scope, parentTask, {
      title: command.title,
      status: command.status,
      priority: command.priority,
      assigneeUserId: command.assigneeUserId,
      dueDate: command.dueDate,
    });

    const now = new Date();

    const data: CreateTaskData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: parentTask.projectId,
      milestoneId: parentTask.milestoneId,
      parentTaskId,
      title: command.title.trim(),
      description: null,
      status: command.status ?? 'TODO',
      priority: command.priority ?? 'NORMAL',
      assigneeUserId: command.assigneeUserId ?? null,
      startDate: null,
      dueDate: command.dueDate ?? null,
      estimatedHours: null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.taskRepository.create(data));
  }

  async updateSubtask(
    scope: TaskScope,
    parentTaskId: string,
    subtaskId: string,
    command: UpdateSubtaskCommand,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    await this.requireParentTask(scope, parentTaskId);
    const existing = await this.requireTask(scope, subtaskId, { includeArchived: true });

    await this.taskDomainService.validateUpdateSubtask(scope, parentTaskId, existing, {
      title: command.title,
      status: command.status,
      priority: command.priority,
      assigneeUserId: command.assigneeUserId,
      dueDate: command.dueDate,
    });

    const now = new Date();
    const data: UpdateTaskData = {
      ...(command.title !== undefined ? { title: command.title.trim() } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.assigneeUserId !== undefined ? { assigneeUserId: command.assigneeUserId } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.taskRepository.update(scope, subtaskId, data);
      if (updated === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Subtask was not found.');
      }

      return updated;
    });
  }

  async deleteSubtask(
    scope: TaskScope,
    parentTaskId: string,
    subtaskId: string,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    await this.requireParentTask(scope, parentTaskId);
    const existing = await this.requireTask(scope, subtaskId);

    this.taskDomainService.assertSubtaskBelongsToParent(existing, parentTaskId);

    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.taskRepository.softDelete(scope, subtaskId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Subtask was not found.');
      }

      return deleted;
    });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async requireParentTask(scope: TaskScope, parentTaskId: string): Promise<TaskRecord> {
    const parentTask = await this.taskRepository.findById(scope, parentTaskId);

    if (parentTask === null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.PARENT_TASK_NOT_FOUND,
        'Parent task was not found.',
      );
    }

    if (parentTask.parentTaskId !== null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.NESTED_SUBTASKS_NOT_ALLOWED,
        'Subtasks cannot be created under another subtask.',
      );
    }

    return parentTask;
  }

  private async requireTask(
    scope: TaskScope,
    taskId: string,
    options?: FindTaskByIdOptions,
  ): Promise<TaskRecord> {
    const task = await this.taskRepository.findById(scope, taskId, options);

    if (task === null) {
      throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
    }

    return task;
  }
}
