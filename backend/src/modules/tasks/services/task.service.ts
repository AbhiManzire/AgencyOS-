import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activities/services/activity.service';
import { WorkflowEventDispatcher } from '../../automation/services/workflow-event-dispatcher.service';
import { NOTIFICATION_EVENT_KEYS } from '../../notifications/events/notification-event.catalog';
import { ProjectNotificationEmitter } from '../../notifications/events/project-notification.emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskDomainService } from '../domain/task-domain.service';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from '../domain/task-domain.errors';
import {
  TASK_DEPENDENCY_REPOSITORY,
  TASK_REPOSITORY,
  type CreateTaskData,
  type FindTaskByIdOptions,
  type TaskDependencyRecord,
  type TaskDependencyRepository,
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
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: TaskRepository,
    @Inject(TASK_DEPENDENCY_REPOSITORY)
    private readonly taskDependencyRepository: TaskDependencyRepository,
    private readonly taskDomainService: TaskDomainService,
    private readonly activityService: ActivityService,
    private readonly projectNotificationEmitter: ProjectNotificationEmitter,
    private readonly workflowEventDispatcher: WorkflowEventDispatcher,
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
      code: command.code,
      status: command.status,
      priority: command.priority,
      type: command.type,
      assigneeUserId: command.assigneeUserId,
      reporterUserId: command.reporterUserId,
      startDate: command.startDate,
      dueDate: command.dueDate,
      estimatedHours: command.estimatedHours,
      actualHours: command.actualHours,
      boardOrder: command.boardOrder,
    });

    const now = new Date();

    const data: CreateTaskData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: command.projectId,
      milestoneId: command.milestoneId ?? null,
      parentTaskId: null,
      code: normalizeOptionalCode(command.code),
      title: command.title.trim(),
      description: command.description ?? null,
      status: command.status ?? 'TODO',
      priority: command.priority ?? 'MEDIUM',
      type: command.type ?? 'FEATURE',
      assigneeUserId: command.assigneeUserId ?? null,
      reporterUserId: command.reporterUserId ?? context.actorUserId,
      startDate: command.startDate ?? null,
      dueDate: command.dueDate ?? null,
      estimatedHours: command.estimatedHours ?? null,
      actualHours: command.actualHours ?? null,
      boardOrder: command.boardOrder ?? 0,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const created = await this.taskRepository.create(data);
      await this.emitActivity(
        scope,
        created.id,
        'task.created',
        'Task Created',
        context,
        undefined,
        'Task was created.',
      );

      if (created.assigneeUserId !== null) {
        await this.emitActivity(
          scope,
          created.id,
          'TASK_ASSIGNED',
          'Task Assigned',
          context,
          { assigneeUserId: created.assigneeUserId },
          'Task was assigned.',
        );
        await this.emitTaskAssignedNotification(
          scope,
          created.id,
          created.projectId,
          created.title,
          created.assigneeUserId,
        );
      }

      return created;
    });
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
      code: command.code,
      status: command.status,
      priority: command.priority,
      type: command.type,
      assigneeUserId: command.assigneeUserId,
      reporterUserId: command.reporterUserId,
      startDate: command.startDate,
      dueDate: command.dueDate,
      estimatedHours: command.estimatedHours,
      actualHours: command.actualHours,
      boardOrder: command.boardOrder,
    });

    const now = new Date();
    const nextStatus = command.status;
    let completedAt: Date | null | undefined;

    if (nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = existing.completedAt ?? now;
    } else if (
      nextStatus !== undefined &&
      nextStatus !== 'COMPLETED' &&
      existing.status === 'COMPLETED'
    ) {
      completedAt = null;
    }

    const data: UpdateTaskData = {
      ...(command.title !== undefined ? { title: command.title.trim() } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.milestoneId !== undefined ? { milestoneId: command.milestoneId } : {}),
      ...(command.code !== undefined ? { code: normalizeOptionalCode(command.code) } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.type !== undefined ? { type: command.type } : {}),
      ...(command.assigneeUserId !== undefined ? { assigneeUserId: command.assigneeUserId } : {}),
      ...(command.reporterUserId !== undefined ? { reporterUserId: command.reporterUserId } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.estimatedHours !== undefined ? { estimatedHours: command.estimatedHours } : {}),
      ...(command.actualHours !== undefined ? { actualHours: command.actualHours } : {}),
      ...(command.boardOrder !== undefined ? { boardOrder: command.boardOrder } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.taskRepository.update(scope, taskId, data);
      if (updated === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
      }

      const statusChanged = command.status !== undefined && command.status !== existing.status;

      if (statusChanged) {
        await this.emitActivity(
          scope,
          updated.id,
          'task.status_changed',
          'Status Changed',
          context,
          { from: existing.status, to: command.status },
          `Status changed from ${existing.status} to ${command.status}.`,
        );

        if (command.status === 'COMPLETED') {
          await this.emitActivity(
            scope,
            updated.id,
            'TASK',
            'Task Completed',
            context,
            undefined,
            'Task was completed.',
            `task.completed:${updated.id}`,
          );
          this.emitWorkflowEvent(scope, updated, context.actorUserId);
        }
      } else {
        await this.emitActivity(
          scope,
          updated.id,
          'task.updated',
          'Task Updated',
          context,
          undefined,
          'Task details were updated.',
        );
      }

      if (
        command.assigneeUserId !== undefined &&
        command.assigneeUserId !== existing.assigneeUserId
      ) {
        if (command.assigneeUserId !== null) {
          await this.emitActivity(
            scope,
            updated.id,
            'TASK_ASSIGNED',
            'Task Assigned',
            context,
            {
              from: existing.assigneeUserId,
              to: command.assigneeUserId,
            },
            existing.assigneeUserId !== null ? 'Task was reassigned.' : 'Task was assigned.',
          );
          await this.emitTaskAssignedNotification(
            scope,
            updated.id,
            updated.projectId,
            updated.title,
            command.assigneeUserId,
          );
        }
      }

      return updated;
    });
  }

  async archiveTask(
    scope: TaskScope,
    taskId: string,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    const existing = await this.requireTask(scope, taskId);
    this.taskDomainService.validateArchive(scope, existing);

    const now = new Date();

    return this.runInTransaction(async () => {
      const archived = await this.taskRepository.softDelete(scope, taskId, {
        status: 'ARCHIVED',
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (archived === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
      }

      await this.emitActivity(
        scope,
        archived.id,
        'task.archived',
        'Archived',
        context,
        undefined,
        'Task was archived.',
      );
      return archived;
    });
  }

  async restoreTask(
    scope: TaskScope,
    taskId: string,
    context: TaskApplicationContext,
  ): Promise<TaskRecord> {
    const existing = await this.taskRepository.findById(scope, taskId, {
      includeArchived: true,
    });

    if (existing === null) {
      throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
    }

    this.taskDomainService.validateRestore(scope, existing);

    const now = new Date();

    return this.runInTransaction(async () => {
      const restored = await this.taskRepository.restore(scope, taskId, {
        status: 'TODO',
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (restored === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Task was not found.');
      }

      await this.emitActivity(
        scope,
        restored.id,
        'task.restored',
        'Restored',
        context,
        undefined,
        'Task was restored.',
      );
      return restored;
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
      priority: query.priority,
      type: query.type,
      assigneeUserId: query.assigneeUserId,
      reporterUserId: query.reporterUserId,
      q: query.q,
      dueFrom: query.dueFrom,
      dueTo: query.dueTo,
      boardOrderFrom: query.boardOrderFrom,
      boardOrderTo: query.boardOrderTo,
      includeArchived: query.includeArchived,
      archivedOnly: query.archivedOnly,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
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
      priority: command.priority ?? 'MEDIUM',
      type: 'FEATURE',
      assigneeUserId: command.assigneeUserId ?? null,
      reporterUserId: context.actorUserId,
      startDate: null,
      dueDate: command.dueDate ?? null,
      estimatedHours: null,
      actualHours: null,
      boardOrder: 0,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const created = await this.taskRepository.create(data);
      await this.emitActivity(
        scope,
        created.id,
        'task.created',
        'Subtask Created',
        context,
        { parentTaskId },
        'Subtask was created.',
      );
      return created;
    });
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
    let completedAt: Date | null | undefined;

    if (command.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      completedAt = existing.completedAt ?? now;
    } else if (
      command.status !== undefined &&
      command.status !== 'COMPLETED' &&
      existing.status === 'COMPLETED'
    ) {
      completedAt = null;
    }

    const data: UpdateTaskData = {
      ...(command.title !== undefined ? { title: command.title.trim() } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.assigneeUserId !== undefined ? { assigneeUserId: command.assigneeUserId } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.taskRepository.update(scope, subtaskId, data);
      if (updated === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Subtask was not found.');
      }

      if (command.status !== undefined && command.status !== existing.status) {
        await this.emitActivity(
          scope,
          updated.id,
          'task.status_changed',
          'Status Changed',
          context,
          { from: existing.status, to: command.status },
          `Status changed from ${existing.status} to ${command.status}.`,
        );

        if (command.status === 'COMPLETED') {
          await this.emitActivity(
            scope,
            updated.id,
            'TASK',
            'Task Completed',
            context,
            undefined,
            'Subtask was completed.',
            `task.completed:${updated.id}`,
          );
        }
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
        status: 'ARCHIVED',
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new TaskDomainError(TASK_DOMAIN_ERROR_CODES.TASK_NOT_FOUND, 'Subtask was not found.');
      }

      await this.emitActivity(
        scope,
        deleted.id,
        'task.archived',
        'Archived',
        context,
        { parentTaskId },
        'Subtask was archived.',
      );

      return deleted;
    });
  }

  async listDependencies(
    scope: TaskScope,
    taskId: string,
  ): Promise<readonly TaskDependencyRecord[]> {
    await this.requireTask(scope, taskId);
    return this.taskDependencyRepository.listBlockedBy(scope, taskId);
  }

  async addDependency(
    scope: TaskScope,
    taskId: string,
    dependsOnTaskId: string,
    context: TaskApplicationContext,
  ): Promise<TaskDependencyRecord> {
    const task = await this.requireTask(scope, taskId);
    await this.taskDomainService.validateAddDependency(scope, task, dependsOnTaskId);

    const now = new Date();

    return this.runInTransaction(async () => {
      const created = await this.taskDependencyRepository.create({
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        taskId,
        dependsOnTaskId,
        createdAt: now,
      });

      await this.emitActivity(
        scope,
        taskId,
        'task.dependency_added',
        'Dependency Added',
        context,
        { dependsOnTaskId },
        'Task dependency was added.',
      );

      return created;
    });
  }

  async removeDependency(scope: TaskScope, taskId: string, dependencyId: string): Promise<void> {
    await this.requireTask(scope, taskId);
    const removed = await this.taskDependencyRepository.delete(scope, taskId, dependencyId);

    if (!removed) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_NOT_FOUND,
        'Task dependency was not found.',
      );
    }
  }

  private async emitTaskAssignedNotification(
    scope: TaskScope,
    taskId: string,
    projectId: string,
    taskTitle: string,
    assigneeUserId: string,
  ): Promise<void> {
    try {
      const project = await this.prisma.project.findFirst({
        where: {
          id: projectId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
        select: { name: true },
      });

      await this.projectNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.PROJECT_TASK_ASSIGNED,
        scope,
        assigneeUserId,
        { title: taskTitle, projectName: project?.name ?? 'Project' },
        {
          entityType: 'Task',
          entityId: taskId,
          linkPath: `/projects/${projectId}/tasks/${taskId}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit PROJECT_TASK_ASSIGNED for task ${taskId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private emitWorkflowEvent(scope: TaskScope, task: TaskRecord, actorUserId?: string | null): void {
    void this.workflowEventDispatcher
      .dispatch({
        scope: { tenantId: scope.tenantId, workspaceId: scope.workspaceId },
        triggerType: 'TASK_COMPLETED',
        entityType: 'task',
        entityId: task.id,
        actorUserId: actorUserId ?? undefined,
        payload: {
          entityType: 'task',
          entityId: task.id,
          id: task.id,
          projectId: task.projectId,
          status: task.status,
          title: task.title,
          assigneeUserId: task.assigneeUserId,
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Workflow emit TASK_COMPLETED failed for task ${task.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async emitActivity(
    scope: TaskScope,
    taskId: string,
    type: string,
    title: string,
    context: TaskApplicationContext,
    metadata?: Prisma.InputJsonValue,
    description?: string,
    dedupeKey?: string,
  ): Promise<void> {
    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'task',
        entityId: taskId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
        ...(dedupeKey !== undefined ? { dedupeKey } : {}),
      },
      { actorUserId: context.actorUserId },
    );
  }

  private async requireParentTask(scope: TaskScope, parentTaskId: string): Promise<TaskRecord> {
    const parentTask = await this.taskRepository.findById(scope, parentTaskId);

    if (parentTask === null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.PARENT_TASK_NOT_FOUND,
        'Parent task was not found.',
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

function normalizeOptionalCode(code?: string | null): string | null {
  if (code === undefined || code === null) {
    return null;
  }

  const trimmed = code.trim();
  return trimmed.length === 0 ? null : trimmed;
}
