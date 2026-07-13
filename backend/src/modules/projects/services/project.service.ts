import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activities/services/activity.service';
import { WorkflowEventDispatcher } from '../../automation/services/workflow-event-dispatcher.service';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
  type WorkspaceOwnerOption,
} from '../../clients/repositories/client.repository.interface';
import { ProjectDomainService } from '../domain/project-domain.service';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../domain/project-domain.errors';
import type { ProjectMembershipContext } from '../domain/project-domain.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_MEMBER_REPOSITORY,
  type ProjectMemberRepository,
} from '../repositories/project-member.repository.interface';
import {
  PROJECT_REPOSITORY,
  type CreateProjectData,
  type DepartmentOption,
  type FindByIdOptions,
  type ProjectRepository,
  type ProjectScope,
  type ProjectTransactionClient,
  type UpdateProjectData,
} from '../repositories/project.repository.interface';
import { ProjectTemplateApplyService } from '../templates/services/project-template-apply.service';
import type {
  CreateProjectCommand,
  GetProjectOptions,
  ListProjectsQuery,
  ListProjectsResult,
  ProjectApplicationContext,
  ProjectRecord,
  RestoreProjectCommand,
  UpdateProjectCommand,
} from './project-application.types';

/**
 * Application service — orchestrates project use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: ProjectMemberRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    private readonly projectDomainService: ProjectDomainService,
    private readonly activityService: ActivityService,
    private readonly workflowEventDispatcher: WorkflowEventDispatcher,
    private readonly prisma: PrismaService,
    @Optional()
    private readonly projectTemplateApplyService?: ProjectTemplateApplyService,
  ) {}

  async createProject(
    scope: ProjectScope,
    command: CreateProjectCommand,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const membership = await this.resolveMembership(scope);

    await this.projectDomainService.validateCreate(
      scope,
      {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        name: command.name,
        clientId: command.clientId,
        projectManagerUserId: command.projectManagerUserId,
        code: command.code,
        status: command.status,
        startDate: command.startDate,
        targetEndDate: command.targetEndDate,
        budgetAmount: command.budgetAmount,
        estimatedHours: command.estimatedHours,
        actualHours: command.actualHours,
      },
      membership,
    );

    const now = new Date();

    const data: CreateProjectData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId: command.clientId,
      name: command.name.trim(),
      code: normalizeOptionalCode(command.code),
      description: command.description,
      status: command.status ?? 'PLANNING',
      projectManagerUserId: command.projectManagerUserId,
      departmentId: command.departmentId ?? null,
      dealId: command.dealId ?? null,
      templateId: command.templateId ?? null,
      primaryContactId: command.primaryContactId ?? null,
      serviceType: command.serviceType ?? null,
      serviceLabel: command.serviceLabel ?? null,
      priority: command.priority ?? 'NORMAL',
      startDate: command.startDate,
      targetEndDate: command.targetEndDate,
      budgetAmount: command.budgetAmount ?? null,
      estimatedHours: command.estimatedHours ?? null,
      actualHours: command.actualHours ?? null,
      isBillable: command.isBillable ?? true,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    const created = await this.runInTransaction(async (tx) => {
      const project = await this.projectRepository.create(data, tx);
      await this.emitActivity(
        scope,
        project.id,
        'PROJECT_CREATED',
        'Project Created',
        context,
        undefined,
        'Project was created.',
      );
      return project;
    });

    this.emitWorkflowEvent(scope, created, context.actorUserId);

    if (command.templateId && this.projectTemplateApplyService !== undefined) {
      return this.projectTemplateApplyService.applyTemplate(scope, created.id, command.templateId, {
        actorUserId: context.actorUserId,
      });
    }

    return created;
  }

  async updateProject(
    scope: ProjectScope,
    projectId: string,
    command: UpdateProjectCommand,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.requireProject(scope, projectId, { includeArchived: true });
    const membership = await this.resolveMembership(scope);

    await this.projectDomainService.validateUpdate(
      scope,
      existing,
      {
        name: command.name,
        code: command.code,
        status: command.status,
        startDate: command.startDate,
        targetEndDate: command.targetEndDate,
        budgetAmount: command.budgetAmount,
        estimatedHours: command.estimatedHours,
        actualHours: command.actualHours,
        projectManagerUserId: command.projectManagerUserId,
      },
      membership,
    );

    const now = new Date();
    const nextStatus = command.status ?? existing.status;
    const statusChanged = command.status !== undefined && command.status !== existing.status;

    const data: UpdateProjectData = {
      ...(command.name !== undefined ? { name: command.name.trim() } : {}),
      ...(command.code !== undefined ? { code: normalizeOptionalCode(command.code) } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.projectManagerUserId !== undefined
        ? { projectManagerUserId: command.projectManagerUserId }
        : {}),
      ...(command.departmentId !== undefined ? { departmentId: command.departmentId } : {}),
      ...(command.dealId !== undefined ? { dealId: command.dealId } : {}),
      ...(command.templateId !== undefined ? { templateId: command.templateId } : {}),
      ...(command.primaryContactId !== undefined
        ? { primaryContactId: command.primaryContactId }
        : {}),
      ...(command.serviceType !== undefined ? { serviceType: command.serviceType } : {}),
      ...(command.serviceLabel !== undefined ? { serviceLabel: command.serviceLabel } : {}),
      ...(command.healthStatus !== undefined ? { healthStatus: command.healthStatus } : {}),
      ...(command.healthScore !== undefined ? { healthScore: command.healthScore } : {}),
      ...(command.healthCalculatedAt !== undefined
        ? { healthCalculatedAt: command.healthCalculatedAt }
        : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.targetEndDate !== undefined ? { targetEndDate: command.targetEndDate } : {}),
      ...(command.budgetAmount !== undefined ? { budgetAmount: command.budgetAmount } : {}),
      ...(command.estimatedHours !== undefined ? { estimatedHours: command.estimatedHours } : {}),
      ...(command.actualHours !== undefined ? { actualHours: command.actualHours } : {}),
      ...(command.isBillable !== undefined ? { isBillable: command.isBillable } : {}),
      ...(nextStatus === 'COMPLETED' && existing.completedAt === null ? { completedAt: now } : {}),
      ...(nextStatus === 'INVOICE_READY' && existing.invoiceReadyAt === null
        ? { invoiceReadyAt: now }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.projectRepository.update(scope, projectId, data, tx);
      if (updated === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      if (statusChanged) {
        await this.emitActivity(
          scope,
          updated.id,
          'project.status_changed',
          'Status Changed',
          context,
          { from: existing.status, to: updated.status },
          `Status changed from ${existing.status} to ${updated.status}.`,
        );
      } else {
        await this.emitActivity(
          scope,
          updated.id,
          'project.updated',
          'Project Updated',
          context,
          undefined,
          'Project details were updated.',
        );
      }

      return updated;
    });
  }

  async completeProject(
    scope: ProjectScope,
    projectId: string,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.requireProject(scope, projectId);
    this.projectDomainService.validateComplete(scope, existing);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.projectRepository.update(
        scope,
        projectId,
        {
          status: 'COMPLETED',
          completedAt: existing.completedAt ?? now,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (updated === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      await this.emitActivity(
        scope,
        updated.id,
        'project.status_changed',
        'Status Changed',
        context,
        {
          from: existing.status,
          to: 'COMPLETED',
        },
        `Status changed from ${existing.status} to COMPLETED.`,
      );

      return updated;
    });
  }

  async markInvoiceReady(
    scope: ProjectScope,
    projectId: string,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.requireProject(scope, projectId);
    this.projectDomainService.validateInvoiceReady(scope, existing);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.projectRepository.update(
        scope,
        projectId,
        {
          status: 'INVOICE_READY',
          invoiceReadyAt: existing.invoiceReadyAt ?? now,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (updated === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      await this.emitActivity(
        scope,
        updated.id,
        'project.status_changed',
        'Status Changed',
        context,
        { from: existing.status, to: 'INVOICE_READY' },
        `Status changed from ${existing.status} to INVOICE_READY.`,
      );

      return updated;
    });
  }

  async archiveProject(
    scope: ProjectScope,
    projectId: string,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.requireProject(scope, projectId);
    this.projectDomainService.validateArchive(scope, existing);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.projectRepository.archive(
        scope,
        projectId,
        {
          status: 'ARCHIVED',
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (archived === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      await this.emitActivity(
        scope,
        archived.id,
        'project.archived',
        'Archived',
        context,
        undefined,
        'Project was archived.',
      );
      return archived;
    });
  }

  async restoreProject(
    scope: ProjectScope,
    projectId: string,
    command: RestoreProjectCommand,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.projectRepository.findById(scope, projectId, {
      includeArchived: true,
    });

    if (existing === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    this.projectDomainService.validateRestore(scope, existing, {
      targetStatus: command.targetStatus,
    });

    const now = new Date();
    const targetStatus = command.targetStatus ?? 'ACTIVE';

    return this.runInTransaction(async (tx) => {
      const restored = await this.projectRepository.restore(
        scope,
        projectId,
        {
          status: targetStatus,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );

      if (restored === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      await this.emitActivity(
        scope,
        restored.id,
        'project.restored',
        'Restored',
        context,
        undefined,
        'Project was restored.',
      );
      return restored;
    });
  }

  async getProject(
    scope: ProjectScope,
    projectId: string,
    options: GetProjectOptions = {},
  ): Promise<ProjectRecord> {
    const project = await this.projectRepository.findById(scope, projectId, {
      includeArchived: options.includeArchived,
    });

    if (project === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    this.projectDomainService.ensureWorkspaceOwnership(scope, project);
    return project;
  }

  async listProjects(
    scope: ProjectScope,
    query: ListProjectsQuery = {},
  ): Promise<ListProjectsResult> {
    return this.projectRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
      clientId: query.clientId,
      includeArchived: query.includeArchived,
      archivedOnly: query.archivedOnly,
      q: query.q,
      projectManagerUserId: query.projectManagerUserId,
      departmentId: query.departmentId,
      priority: query.priority,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async listWorkspaceOwners(scope: ProjectScope): Promise<readonly WorkspaceOwnerOption[]> {
    return this.clientRepository.listWorkspaceOwners(scope);
  }

  async listDepartments(scope: ProjectScope): Promise<readonly DepartmentOption[]> {
    return this.projectRepository.listDepartments(scope);
  }

  private emitWorkflowEvent(
    scope: ProjectScope,
    project: ProjectRecord,
    actorUserId?: string | null,
  ): void {
    void this.workflowEventDispatcher
      .dispatch({
        scope: { tenantId: scope.tenantId, workspaceId: scope.workspaceId },
        triggerType: 'PROJECT_CREATED',
        entityType: 'project',
        entityId: project.id,
        actorUserId: actorUserId ?? undefined,
        payload: {
          entityType: 'project',
          entityId: project.id,
          id: project.id,
          name: project.name,
          clientId: project.clientId,
          status: project.status,
          projectManagerUserId: project.projectManagerUserId,
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Workflow emit PROJECT_CREATED failed for project ${project.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private async runInTransaction<T>(
    work: (tx: ProjectTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async emitActivity(
    scope: ProjectScope,
    projectId: string,
    type: string,
    title: string,
    context: ProjectApplicationContext,
    metadata?: Prisma.InputJsonValue,
    description?: string,
  ): Promise<void> {
    await this.activityService.createActivity(
      scope,
      {
        entityType: 'project',
        entityId: projectId,
        type,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
      },
      { actorUserId: context.actorUserId },
    );
  }

  private async resolveMembership(scope: ProjectScope): Promise<ProjectMembershipContext> {
    const users = await this.projectMemberRepository.listWorkspaceUsers(scope);
    const memberIds = new Set(users.map((user) => user.id));

    return {
      isWorkspaceMember: (userId: string) => memberIds.has(userId),
    };
  }

  private async requireProject(
    scope: ProjectScope,
    projectId: string,
    options?: FindByIdOptions,
  ): Promise<ProjectRecord> {
    const project = await this.projectRepository.findById(scope, projectId, options);

    if (project === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    return project;
  }
}

function normalizeOptionalCode(code: string | null | undefined): string | null {
  if (code === undefined || code === null) {
    return null;
  }

  const trimmed = code.trim();
  return trimmed.length > 0 ? trimmed : null;
}
