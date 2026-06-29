import type { TaskPriority, TaskStatus } from '@prisma/client';
import type {
  ProjectMilestoneRepository,
  ProjectMilestoneScope,
} from '../../projects/repositories/project-milestone.repository.interface';
import type {
  ProjectRecord,
  ProjectRepository,
  ProjectScope,
} from '../../projects/repositories/project.repository.interface';
import type {
  TaskRecord,
  TaskRepository,
  TaskScope,
} from '../repositories/task.repository.interface';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from './task-domain.errors';
import {
  TASK_CREATABLE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type CreateSubtaskValidationInput,
  type CreateTaskValidationInput,
  type UpdateSubtaskValidationInput,
  type UpdateTaskValidationInput,
} from './task-domain.types';

const STATUS_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  TODO: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'DONE', 'TODO', 'CANCELLED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

export class TaskDomainService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectMilestoneRepository: ProjectMilestoneRepository,
  ) {}

  async validateCreate(scope: TaskScope, input: CreateTaskValidationInput): Promise<void> {
    this.assertScopeAlignment(scope, input.tenantId, input.workspaceId);
    this.assertTitleRequired(input.title);

    const status = input.status ?? 'TODO';
    this.assertCreatableStatus(status);
    this.assertValidPriority(input.priority ?? 'NORMAL');
    this.assertDateRange(input.startDate, input.dueDate);
    this.assertEstimatedHours(input.estimatedHours);

    await this.assertProjectEligible(scope, input.projectId);

    if (input.milestoneId !== undefined && input.milestoneId !== null) {
      await this.assertMilestoneBelongsToProject(scope, input.projectId, input.milestoneId);
    }

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }
  }

  async validateUpdate(
    scope: TaskScope,
    task: TaskRecord,
    input: UpdateTaskValidationInput,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, task);
    this.assertTaskIsActive(task);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusTransition(task.status, input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    const startDate = input.startDate !== undefined ? input.startDate : task.startDate;
    const dueDate = input.dueDate !== undefined ? input.dueDate : task.dueDate;
    this.assertDateRange(startDate, dueDate);

    if (input.estimatedHours !== undefined) {
      this.assertEstimatedHours(input.estimatedHours);
    }

    if (input.milestoneId !== undefined && input.milestoneId !== null) {
      await this.assertMilestoneBelongsToProject(scope, task.projectId, input.milestoneId);
    }

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }
  }

  ensureWorkspaceOwnership(scope: TaskScope, task: TaskRecord): void {
    if (task.tenantId !== scope.tenantId || task.workspaceId !== scope.workspaceId) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Task does not belong to the requested workspace.',
      );
    }
  }

  async validateCreateSubtask(
    scope: TaskScope,
    parentTask: TaskRecord,
    input: CreateSubtaskValidationInput,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, parentTask);
    this.assertTaskIsActive(parentTask);
    this.assertParentTaskEligible(parentTask);
    this.assertTitleRequired(input.title);

    const status = input.status ?? 'TODO';
    this.assertCreatableStatus(status);
    this.assertValidPriority(input.priority ?? 'NORMAL');

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }
  }

  async validateUpdateSubtask(
    scope: TaskScope,
    parentTaskId: string,
    subtask: TaskRecord,
    input: UpdateSubtaskValidationInput,
  ): Promise<void> {
    this.ensureWorkspaceOwnership(scope, subtask);
    this.assertTaskIsActive(subtask);
    this.assertSubtaskBelongsToParent(subtask, parentTaskId);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.status !== undefined) {
      this.assertValidStatus(input.status);
      this.assertStatusTransition(subtask.status, input.status);
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }
  }

  assertSubtaskBelongsToParent(subtask: TaskRecord, parentTaskId: string): void {
    if (subtask.parentTaskId !== parentTaskId) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.SUBTASK_PARENT_MISMATCH,
        'Subtask does not belong to the requested parent task.',
      );
    }
  }

  private assertParentTaskEligible(parentTask: TaskRecord): void {
    if (parentTask.parentTaskId !== null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.NESTED_SUBTASKS_NOT_ALLOWED,
        'Subtasks cannot be created under another subtask.',
      );
    }
  }

  private assertScopeAlignment(scope: TaskScope, tenantId: string, workspaceId: string): void {
    if (scope.tenantId !== tenantId || scope.workspaceId !== workspaceId) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TENANT_SCOPE_MISMATCH,
        'Task data must match the active tenant and workspace scope.',
      );
    }
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TASK_TITLE_REQUIRED,
        'Task title is required.',
      );
    }
  }

  private assertCreatableStatus(status: TaskStatus): void {
    if (!TASK_CREATABLE_STATUSES.includes(status)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not allowed when creating a task.`,
      );
    }
  }

  private assertValidStatus(status: TaskStatus): void {
    if (!TASK_STATUSES.includes(status)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_STATUS,
        `Status "${status}" is not a valid task state.`,
      );
    }
  }

  private assertValidPriority(priority: TaskPriority): void {
    if (!TASK_PRIORITIES.includes(priority)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_PRIORITY,
        `Priority "${priority}" is not valid.`,
      );
    }
  }

  private assertStatusTransition(from: TaskStatus, to: TaskStatus): void {
    if (from === to) {
      return;
    }

    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_STATUS_TRANSITION,
        `Cannot transition task status from "${from}" to "${to}".`,
      );
    }
  }

  private assertDateRange(startDate?: Date | null, dueDate?: Date | null): void {
    if (
      startDate === undefined ||
      startDate === null ||
      dueDate === undefined ||
      dueDate === null
    ) {
      return;
    }

    if (dueDate.getTime() < startDate.getTime()) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_DATE_RANGE,
        'Due date must be on or after the start date.',
      );
    }
  }

  private assertEstimatedHours(estimatedHours?: number | null): void {
    if (estimatedHours === undefined || estimatedHours === null) {
      return;
    }

    if (estimatedHours < 0) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_ESTIMATED_HOURS,
        'Estimated hours must be zero or greater.',
      );
    }
  }

  private assertTaskIsActive(task: TaskRecord): void {
    if (task.deletedAt !== null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TASK_ARCHIVED,
        'Task is archived and cannot be modified.',
      );
    }
  }

  private async assertProjectEligible(
    scope: ProjectScope,
    projectId: string,
  ): Promise<ProjectRecord> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    if (project.deletedAt !== null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.PROJECT_ARCHIVED,
        'Project is archived and cannot be linked to tasks.',
      );
    }

    return project;
  }

  private async assertMilestoneBelongsToProject(
    scope: TaskScope,
    projectId: string,
    milestoneId: string,
  ): Promise<void> {
    const milestoneScope: ProjectMilestoneScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
    };

    const milestone = await this.projectMilestoneRepository.findById(milestoneScope, milestoneId);
    if (milestone === null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.MILESTONE_NOT_FOUND,
        'Milestone was not found.',
      );
    }
  }

  private async assertAssigneeEligible(scope: TaskScope, assigneeUserId: string): Promise<void> {
    if (!(await this.taskRepository.isWorkspaceUser(scope, assigneeUserId))) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.ASSIGNEE_NOT_WORKSPACE_MEMBER,
        'Assignee must be an active member of the workspace.',
      );
    }
  }
}
