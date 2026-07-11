import type { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
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
  TaskDependencyRepository,
  TaskRecord,
  TaskRepository,
  TaskScope,
} from '../repositories/task.repository.interface';
import { TASK_DOMAIN_ERROR_CODES, TaskDomainError } from './task-domain.errors';
import {
  TASK_CREATABLE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type CreateSubtaskValidationInput,
  type CreateTaskValidationInput,
  type UpdateSubtaskValidationInput,
  type UpdateTaskValidationInput,
} from './task-domain.types';

const STATUS_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  BACKLOG: ['TODO', 'CANCELLED'],
  TODO: ['BACKLOG', 'IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['TODO', 'REVIEW', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
  REVIEW: ['IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'],
  BLOCKED: ['TODO', 'IN_PROGRESS', 'REVIEW', 'CANCELLED'],
  COMPLETED: ['TODO'],
  CANCELLED: ['TODO'],
  ARCHIVED: [],
};

export class TaskDomainService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectMilestoneRepository: ProjectMilestoneRepository,
    private readonly taskDependencyRepository?: TaskDependencyRepository,
  ) {}

  async validateCreate(scope: TaskScope, input: CreateTaskValidationInput): Promise<void> {
    this.assertScopeAlignment(scope, input.tenantId, input.workspaceId);
    this.assertTitleRequired(input.title);
    this.assertProjectRequired(input.projectId);

    const status = input.status ?? 'TODO';
    this.assertCreatableStatus(status);
    this.assertValidPriority(input.priority ?? 'MEDIUM');
    this.assertValidType(input.type ?? 'FEATURE');
    this.assertDateRange(input.startDate, input.dueDate);
    this.assertEstimatedHours(input.estimatedHours);
    this.assertActualHours(input.actualHours);

    await this.assertProjectEligible(scope, input.projectId);
    await this.assertCodeUnique(scope, input.code);

    if (input.milestoneId !== undefined && input.milestoneId !== null) {
      await this.assertMilestoneBelongsToProject(scope, input.projectId, input.milestoneId);
    }

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }

    if (input.reporterUserId !== undefined && input.reporterUserId !== null) {
      await this.assertReporterEligible(scope, input.reporterUserId);
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

      if (input.status === 'COMPLETED') {
        await this.assertCanComplete(scope, task);
      }
    }

    if (input.priority !== undefined) {
      this.assertValidPriority(input.priority);
    }

    if (input.type !== undefined) {
      this.assertValidType(input.type);
    }

    const startDate = input.startDate !== undefined ? input.startDate : task.startDate;
    const dueDate = input.dueDate !== undefined ? input.dueDate : task.dueDate;
    this.assertDateRange(startDate, dueDate);

    if (input.estimatedHours !== undefined) {
      this.assertEstimatedHours(input.estimatedHours);
    }

    if (input.actualHours !== undefined) {
      this.assertActualHours(input.actualHours);
    }

    if (input.code !== undefined) {
      await this.assertCodeUnique(scope, input.code, task.id);
    }

    if (input.milestoneId !== undefined && input.milestoneId !== null) {
      await this.assertMilestoneBelongsToProject(scope, task.projectId, input.milestoneId);
    }

    if (input.assigneeUserId !== undefined && input.assigneeUserId !== null) {
      await this.assertAssigneeEligible(scope, input.assigneeUserId);
    }

    if (input.reporterUserId !== undefined && input.reporterUserId !== null) {
      await this.assertReporterEligible(scope, input.reporterUserId);
    }
  }

  validateArchive(scope: TaskScope, task: TaskRecord): void {
    this.ensureWorkspaceOwnership(scope, task);
    this.assertTaskIsActive(task);
  }

  validateRestore(scope: TaskScope, task: TaskRecord): void {
    this.ensureWorkspaceOwnership(scope, task);

    if (task.deletedAt === null && task.status !== 'ARCHIVED') {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TASK_NOT_ARCHIVED,
        'Task is not archived and cannot be restored.',
      );
    }
  }

  async validateAddDependency(
    scope: TaskScope,
    task: TaskRecord,
    dependsOnTaskId: string,
  ): Promise<TaskRecord> {
    this.ensureWorkspaceOwnership(scope, task);
    this.assertTaskIsActive(task);

    if (task.id === dependsOnTaskId) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_SELF_NOT_ALLOWED,
        'A task cannot depend on itself.',
      );
    }

    const dependsOn = await this.taskRepository.findById(scope, dependsOnTaskId);
    if (dependsOn === null) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_TARGET_NOT_FOUND,
        'Dependency target task was not found.',
      );
    }

    this.ensureWorkspaceOwnership(scope, dependsOn);
    this.assertTaskIsActive(dependsOn);

    const dependencyRepository = this.requireDependencyRepository();
    if (await dependencyRepository.exists(scope, task.id, dependsOnTaskId)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_ALREADY_EXISTS,
        'This dependency already exists.',
      );
    }

    const wouldCycle = await dependencyRepository.wouldCreateCycle(scope, task.id, dependsOnTaskId);
    if (wouldCycle) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_CYCLE_DETECTED,
        'Adding this dependency would create a cycle.',
      );
    }

    return dependsOn;
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
    this.assertTitleRequired(input.title);

    const status = input.status ?? 'TODO';
    this.assertCreatableStatus(status);
    this.assertValidPriority(input.priority ?? 'MEDIUM');

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

      if (input.status === 'COMPLETED') {
        await this.assertCanComplete(scope, subtask);
      }
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

  private async assertCanComplete(scope: TaskScope, task: TaskRecord): Promise<void> {
    const openSubtasks = await this.taskRepository.countOpenSubtasks(scope, task.id);
    if (openSubtasks > 0) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.OPEN_SUBTASKS_BLOCK_COMPLETION,
        'Cannot complete a task while open subtasks remain.',
      );
    }

    const dependencyRepository = this.taskDependencyRepository;
    if (dependencyRepository === undefined) {
      return;
    }

    const hasIncomplete = await dependencyRepository.hasIncompleteBlockedBy(scope, task.id);
    if (hasIncomplete) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INCOMPLETE_DEPENDENCY_BLOCKS_COMPLETION,
        'Cannot complete a task while blocked by incomplete dependencies.',
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

  private assertProjectRequired(projectId: string): void {
    if (projectId.trim().length === 0) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.PROJECT_REQUIRED,
        'Project is required when creating a task.',
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
    if (!TASK_STATUSES.includes(status) || status === 'ARCHIVED') {
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

  private assertValidType(type: TaskType): void {
    if (!TASK_TYPES.includes(type)) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_TYPE,
        `Type "${type}" is not valid.`,
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

  private assertActualHours(actualHours?: number | null): void {
    if (actualHours === undefined || actualHours === null) {
      return;
    }

    if (actualHours < 0) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.INVALID_ACTUAL_HOURS,
        'Actual hours must be zero or greater.',
      );
    }
  }

  private assertTaskIsActive(task: TaskRecord): void {
    if (task.deletedAt !== null || task.status === 'ARCHIVED') {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TASK_ARCHIVED,
        'Task is archived and cannot be modified.',
      );
    }
  }

  private async assertCodeUnique(
    scope: TaskScope,
    code?: string | null,
    excludeTaskId?: string,
  ): Promise<void> {
    if (code === undefined || code === null) {
      return;
    }

    const normalized = code.trim();
    if (normalized.length === 0) {
      return;
    }

    const existing = await this.taskRepository.findByCode(scope, normalized);
    if (existing !== null && existing.id !== excludeTaskId) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.TASK_CODE_NOT_UNIQUE,
        'Task code must be unique within the workspace.',
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

  private async assertReporterEligible(scope: TaskScope, reporterUserId: string): Promise<void> {
    if (!(await this.taskRepository.isWorkspaceUser(scope, reporterUserId))) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.REPORTER_NOT_WORKSPACE_MEMBER,
        'Reporter must be an active member of the workspace.',
      );
    }
  }

  private requireDependencyRepository(): TaskDependencyRepository {
    if (this.taskDependencyRepository === undefined) {
      throw new TaskDomainError(
        TASK_DOMAIN_ERROR_CODES.DEPENDENCY_NOT_FOUND,
        'Task dependency repository is not configured.',
      );
    }

    return this.taskDependencyRepository;
  }
}
