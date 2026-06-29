import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectMilestoneDomainService } from '../domain/project-milestone-domain.service';
import {
  PROJECT_MILESTONE_DOMAIN_ERROR_CODES,
  ProjectMilestoneDomainError,
} from '../domain/project-milestone-domain.errors';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../domain/project-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_MILESTONE_REPOSITORY,
  type CreateProjectMilestoneData,
  type ProjectMilestoneRecord,
  type ProjectMilestoneRepository,
  type ProjectMilestoneScope,
  type UpdateProjectMilestoneData,
} from '../repositories/project-milestone.repository.interface';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
  type ProjectScope,
} from '../repositories/project.repository.interface';
import type {
  CreateProjectMilestoneCommand,
  ListProjectMilestonesResult,
  ProjectMilestoneApplicationContext,
  UpdateProjectMilestoneCommand,
} from './project-milestone-application.types';

@Injectable()
export class ProjectMilestoneService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_MILESTONE_REPOSITORY)
    private readonly projectMilestoneRepository: ProjectMilestoneRepository,
    private readonly projectMilestoneDomainService: ProjectMilestoneDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listMilestones(
    scope: ProjectScope,
    projectId: string,
  ): Promise<ListProjectMilestonesResult> {
    await this.requireProjectForRead(scope, projectId);
    const milestoneScope = this.toMilestoneScope(scope, projectId);

    const [milestones, availableOwners] = await Promise.all([
      this.projectMilestoneRepository.listByProject(milestoneScope),
      this.projectMilestoneRepository.listWorkspaceUsers(scope),
    ]);

    return { milestones, availableOwners };
  }

  async createMilestone(
    scope: ProjectScope,
    projectId: string,
    command: CreateProjectMilestoneCommand,
    context: ProjectMilestoneApplicationContext,
  ): Promise<ProjectMilestoneRecord> {
    await this.requireProjectForMutation(scope, projectId);

    this.projectMilestoneDomainService.validateCreate({
      name: command.name,
      status: command.status,
      startDate: command.startDate,
      dueDate: command.dueDate,
    });

    if (command.ownerUserId !== undefined && command.ownerUserId !== null) {
      await this.assertWorkspaceUser(scope, command.ownerUserId);
    }

    const milestoneScope = this.toMilestoneScope(scope, projectId);
    const sortOrder = await this.projectMilestoneRepository.getNextSortOrder(milestoneScope);
    const status = command.status ?? 'PLANNED';
    const now = new Date();

    const data: CreateProjectMilestoneData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
      name: command.name.trim(),
      description: command.description ?? null,
      status,
      startDate: command.startDate ?? null,
      dueDate: command.dueDate ?? null,
      ownerUserId: command.ownerUserId ?? null,
      sortOrder,
      completedAt: status === 'COMPLETED' ? now : null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async () => this.projectMilestoneRepository.create(data));
  }

  async updateMilestone(
    scope: ProjectScope,
    projectId: string,
    milestoneId: string,
    command: UpdateProjectMilestoneCommand,
    context: ProjectMilestoneApplicationContext,
  ): Promise<ProjectMilestoneRecord> {
    await this.requireProjectForMutation(scope, projectId);

    const milestoneScope = this.toMilestoneScope(scope, projectId);
    const existing = await this.requireMilestone(milestoneScope, milestoneId);

    const nextStartDate = command.startDate !== undefined ? command.startDate : existing.startDate;
    const nextDueDate = command.dueDate !== undefined ? command.dueDate : existing.dueDate;

    this.projectMilestoneDomainService.validateUpdate({
      name: command.name,
      status: command.status,
      startDate: nextStartDate,
      dueDate: nextDueDate,
    });

    if (command.ownerUserId !== undefined && command.ownerUserId !== null) {
      await this.assertWorkspaceUser(scope, command.ownerUserId);
    }

    const now = new Date();
    const nextStatus = command.status ?? existing.status;
    const data: UpdateProjectMilestoneData = {
      ...(command.name !== undefined ? { name: command.name.trim() } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED'
        ? { completedAt: now }
        : nextStatus !== 'COMPLETED' && existing.status === 'COMPLETED'
          ? { completedAt: null }
          : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async () => {
      const updated = await this.projectMilestoneRepository.update(
        milestoneScope,
        milestoneId,
        data,
      );
      if (updated === null) {
        throw new ProjectMilestoneDomainError(
          PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_MILESTONE_NOT_FOUND,
          'Project milestone was not found.',
        );
      }

      return updated;
    });
  }

  async deleteMilestone(
    scope: ProjectScope,
    projectId: string,
    milestoneId: string,
    context: ProjectMilestoneApplicationContext,
  ): Promise<ProjectMilestoneRecord> {
    await this.requireProjectForMutation(scope, projectId);

    const milestoneScope = this.toMilestoneScope(scope, projectId);
    await this.requireMilestone(milestoneScope, milestoneId);

    const now = new Date();

    return this.prisma.$transaction(async () => {
      const deleted = await this.projectMilestoneRepository.softDelete(
        milestoneScope,
        milestoneId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
      );

      if (deleted === null) {
        throw new ProjectMilestoneDomainError(
          PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_MILESTONE_NOT_FOUND,
          'Project milestone was not found.',
        );
      }

      return deleted;
    });
  }

  private async requireProjectForRead(scope: ProjectScope, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }
  }

  private async requireProjectForMutation(scope: ProjectScope, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    if (project.deletedAt !== null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_ARCHIVED,
        'Project is archived and cannot be modified.',
      );
    }
  }

  private async requireMilestone(
    scope: ProjectMilestoneScope,
    milestoneId: string,
  ): Promise<ProjectMilestoneRecord> {
    const milestone = await this.projectMilestoneRepository.findById(scope, milestoneId);
    if (milestone === null) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_MILESTONE_NOT_FOUND,
        'Project milestone was not found.',
      );
    }

    return milestone;
  }

  private async assertWorkspaceUser(scope: ProjectScope, userId: string): Promise<void> {
    if (!(await this.projectMilestoneRepository.isWorkspaceUser(scope, userId))) {
      throw new ProjectMilestoneDomainError(
        PROJECT_MILESTONE_DOMAIN_ERROR_CODES.USER_NOT_WORKSPACE_MEMBER,
        'Owner must be an active member of the workspace.',
      );
    }
  }

  private toMilestoneScope(scope: ProjectScope, projectId: string): ProjectMilestoneScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
    };
  }
}
