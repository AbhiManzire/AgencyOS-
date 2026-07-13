import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../activities/services/activity.service';
import { NOTIFICATION_EVENT_KEYS } from '../../notifications/events/notification-event.catalog';
import { ProjectNotificationEmitter } from '../../notifications/events/project-notification.emitter';
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
    private readonly activityService: ActivityService,
    private readonly projectNotificationEmitter: ProjectNotificationEmitter,
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
    const project = await this.requireProjectForMutation(scope, projectId);

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
    const completionPercent =
      status === 'COMPLETED' ? 100 : Math.max(0, Math.min(100, command.completionPercent ?? 0));

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
      completionPercent,
      sortOrder,
      completedAt: status === 'COMPLETED' ? now : null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async (tx) => {
      const created = await this.projectMilestoneRepository.create(data);
      if (command.dependsOnMilestoneIds !== undefined) {
        await this.replaceDependencies(
          scope,
          projectId,
          created.id,
          command.dependsOnMilestoneIds,
          tx,
        );
      }

      if (status === 'COMPLETED') {
        await this.emitMilestoneCompleted(scope, project, created, context);
      }

      const refreshed = await this.projectMilestoneRepository.findById(milestoneScope, created.id);
      return refreshed ?? created;
    });
  }

  async updateMilestone(
    scope: ProjectScope,
    projectId: string,
    milestoneId: string,
    command: UpdateProjectMilestoneCommand,
    context: ProjectMilestoneApplicationContext,
  ): Promise<ProjectMilestoneRecord> {
    const project = await this.requireProjectForMutation(scope, projectId);

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
    const becameCompleted = nextStatus === 'COMPLETED' && existing.status !== 'COMPLETED';
    let completionPercent = existing.completionPercent;
    if (nextStatus === 'COMPLETED') {
      completionPercent = 100;
    } else if (command.completionPercent !== undefined && command.completionPercent !== null) {
      completionPercent = Math.max(0, Math.min(100, command.completionPercent));
    }

    const data: UpdateProjectMilestoneData = {
      ...(command.name !== undefined ? { name: command.name.trim() } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.dueDate !== undefined ? { dueDate: command.dueDate } : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.completionPercent !== undefined || becameCompleted || nextStatus === 'COMPLETED'
        ? { completionPercent }
        : {}),
      ...(becameCompleted
        ? { completedAt: now }
        : nextStatus !== 'COMPLETED' && existing.status === 'COMPLETED'
          ? { completedAt: null }
          : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async (tx) => {
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

      if (command.dependsOnMilestoneIds !== undefined) {
        await this.replaceDependencies(
          scope,
          projectId,
          milestoneId,
          command.dependsOnMilestoneIds,
          tx,
        );
      }

      if (becameCompleted) {
        await this.emitMilestoneCompleted(scope, project, updated, context);
      }

      const refreshed = await this.projectMilestoneRepository.findById(milestoneScope, milestoneId);
      return refreshed ?? updated;
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

    return this.prisma.$transaction(async (tx) => {
      await tx.projectMilestoneDependency.deleteMany({
        where: {
          OR: [{ milestoneId }, { dependsOnMilestoneId: milestoneId }],
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
        },
      });

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

  private async replaceDependencies(
    scope: ProjectScope,
    projectId: string,
    milestoneId: string,
    dependsOnMilestoneIds: readonly string[],
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<void> {
    const uniqueIds = [...new Set(dependsOnMilestoneIds.filter((id) => id !== milestoneId))];

    if (uniqueIds.length > 0) {
      const found = await tx.projectMilestone.findMany({
        where: {
          id: { in: [...uniqueIds] },
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          projectId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (found.length !== uniqueIds.length) {
        throw new ProjectMilestoneDomainError(
          PROJECT_MILESTONE_DOMAIN_ERROR_CODES.PROJECT_MILESTONE_NOT_FOUND,
          'One or more dependency milestones were not found on this project.',
        );
      }
    }

    await tx.projectMilestoneDependency.deleteMany({
      where: {
        milestoneId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
    });

    if (uniqueIds.length === 0) {
      return;
    }

    const now = new Date();
    await tx.projectMilestoneDependency.createMany({
      data: uniqueIds.map((dependsOnMilestoneId) => ({
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        milestoneId,
        dependsOnMilestoneId,
        createdAt: now,
      })),
    });
  }

  private async emitMilestoneCompleted(
    scope: ProjectScope,
    project: { id: string; name: string; projectManagerUserId: string | null },
    milestone: ProjectMilestoneRecord,
    context: ProjectMilestoneApplicationContext,
  ): Promise<void> {
    await this.activityService.createActivity(
      scope,
      {
        entityType: 'project',
        entityId: project.id,
        type: 'MILESTONE_COMPLETED',
        title: 'Milestone Completed',
        description: `Milestone "${milestone.name}" was completed.`,
        metadata: { milestoneId: milestone.id },
        dedupeKey: `project.milestone_completed:${milestone.id}`,
      },
      { actorUserId: context.actorUserId },
    );

    if (project.projectManagerUserId !== null) {
      await this.projectNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.PROJECT_MILESTONE_COMPLETED,
        scope,
        project.projectManagerUserId,
        { title: milestone.name, projectName: project.name },
        {
          entityType: 'Project',
          entityId: project.id,
          linkPath: `/projects/${project.id}`,
        },
      );
    }
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

  private async requireProjectForMutation(scope: ProjectScope, projectId: string) {
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

    return project;
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
