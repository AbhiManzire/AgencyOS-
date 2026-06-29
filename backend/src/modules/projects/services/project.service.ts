import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectDomainService } from '../domain/project-domain.service';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../domain/project-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_REPOSITORY,
  type CreateProjectData,
  type FindByIdOptions,
  type ProjectRepository,
  type ProjectScope,
  type UpdateProjectData,
} from '../repositories/project.repository.interface';
import type {
  CreateProjectCommand,
  GetProjectOptions,
  ListProjectsQuery,
  ListProjectsResult,
  ProjectApplicationContext,
  ProjectRecord,
  UpdateProjectCommand,
} from './project-application.types';

/**
 * Application service — orchestrates project use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    private readonly projectDomainService: ProjectDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createProject(
    scope: ProjectScope,
    command: CreateProjectCommand,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    await this.projectDomainService.validateCreate(scope, {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name: command.name,
      clientId: command.clientId,
      code: command.code,
      status: command.status,
      startDate: command.startDate,
      targetEndDate: command.targetEndDate,
    });

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
      priority: command.priority ?? 'NORMAL',
      startDate: command.startDate,
      targetEndDate: command.targetEndDate,
      isBillable: command.isBillable ?? true,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.projectRepository.create(data));
  }

  async updateProject(
    scope: ProjectScope,
    projectId: string,
    command: UpdateProjectCommand,
    context: ProjectApplicationContext,
  ): Promise<ProjectRecord> {
    const existing = await this.requireProject(scope, projectId, { includeArchived: true });

    await this.projectDomainService.validateUpdate(scope, existing, {
      name: command.name,
      code: command.code,
      status: command.status,
      startDate: command.startDate,
      targetEndDate: command.targetEndDate,
    });

    const now = new Date();
    const nextStatus = command.status ?? existing.status;

    const data: UpdateProjectData = {
      ...(command.name !== undefined ? { name: command.name.trim() } : {}),
      ...(command.code !== undefined ? { code: normalizeOptionalCode(command.code) } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.projectManagerUserId !== undefined
        ? { projectManagerUserId: command.projectManagerUserId }
        : {}),
      ...(command.priority !== undefined ? { priority: command.priority } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.targetEndDate !== undefined ? { targetEndDate: command.targetEndDate } : {}),
      ...(command.isBillable !== undefined ? { isBillable: command.isBillable } : {}),
      ...(nextStatus === 'COMPLETED' && existing.completedAt === null ? { completedAt: now } : {}),
      ...(nextStatus === 'INVOICE_READY' && existing.invoiceReadyAt === null
        ? { invoiceReadyAt: now }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.projectRepository.update(scope, projectId, data);
      if (updated === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      return updated;
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
    });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
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
