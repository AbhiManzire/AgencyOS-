import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../../domain/project-domain.errors';
import {
  PROJECT_REPOSITORY,
  type ProjectRecord,
  type ProjectRepository,
  type ProjectScope,
} from '../../repositories/project.repository.interface';
import {
  PROJECT_TEMPLATE_DOMAIN_ERROR_CODES,
  ProjectTemplateDomainError,
} from '../domain/project-template-domain.errors';
import {
  PROJECT_TEMPLATE_REPOSITORY,
  type ProjectTemplateRecord,
  type ProjectTemplateRepository,
  type ProjectTemplateScope,
} from '../repositories/project-template.repository.interface';
import type { ProjectTemplateApplicationContext } from './project-template-application.types';

@Injectable()
export class ProjectTemplateApplyService {
  constructor(
    @Inject(PROJECT_TEMPLATE_REPOSITORY)
    private readonly templateRepository: ProjectTemplateRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async applyTemplate(
    scope: ProjectScope,
    projectId: string,
    templateId: string,
    context: ProjectTemplateApplicationContext,
  ): Promise<ProjectRecord> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    const template = await this.templateRepository.findById(
      this.toTemplateScope(scope),
      templateId,
    );
    if (template?.deletedAt !== null) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NOT_FOUND,
        'Project template was not found.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const baseDate = startOfUtcDay(project.startDate ?? new Date());
      const milestoneIdByTemplateMilestoneId = new Map<string, string>();
      const now = new Date();

      for (const templateMilestone of template.milestones) {
        const milestoneId = randomUUID();
        milestoneIdByTemplateMilestoneId.set(templateMilestone.id, milestoneId);

        await tx.projectMilestone.create({
          data: {
            id: milestoneId,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            name: templateMilestone.name,
            description: templateMilestone.description,
            status: 'PLANNED',
            dueDate: addUtcDays(baseDate, templateMilestone.offsetDays),
            completionPercent: 0,
            sortOrder: templateMilestone.sortOrder,
            createdAt: now,
            updatedAt: now,
            createdByUserId: context.actorUserId,
            updatedByUserId: context.actorUserId,
          },
        });
      }

      for (const templateTask of template.tasks) {
        const taskId = randomUUID();
        const milestoneId =
          templateTask.templateMilestoneId !== null
            ? (milestoneIdByTemplateMilestoneId.get(templateTask.templateMilestoneId) ?? null)
            : null;

        await tx.task.create({
          data: {
            id: taskId,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            milestoneId,
            title: templateTask.title,
            description: templateTask.description,
            status: 'TODO',
            priority: templateTask.priority,
            type: 'FEATURE',
            dueDate: addUtcDays(baseDate, templateTask.offsetDays),
            estimatedHours:
              templateTask.estimatedHours === null
                ? null
                : new Prisma.Decimal(templateTask.estimatedHours),
            reporterUserId: context.actorUserId,
            boardOrder: templateTask.sortOrder,
            createdAt: now,
            updatedAt: now,
            createdByUserId: context.actorUserId,
            updatedByUserId: context.actorUserId,
          },
        });

        const checklistItems = parseChecklistItems(templateTask.checklistJson);
        if (checklistItems.length > 0) {
          await tx.taskChecklistItem.createMany({
            data: checklistItems.map((title, index) => ({
              id: randomUUID(),
              tenantId: scope.tenantId,
              workspaceId: scope.workspaceId,
              taskId,
              title,
              sortOrder: index,
              createdAt: now,
              updatedAt: now,
              createdByUserId: context.actorUserId,
              updatedByUserId: context.actorUserId,
            })),
          });
        }
      }

      for (const deliverable of template.deliverables) {
        await tx.projectDeliverable.create({
          data: {
            id: randomUUID(),
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            projectId,
            title: deliverable.title,
            description: deliverable.description,
            status: 'PENDING',
            sortOrder: deliverable.sortOrder,
            createdAt: now,
            updatedAt: now,
            createdByUserId: context.actorUserId,
            updatedByUserId: context.actorUserId,
          },
        });
      }

      const updateData = {
        templateId: template.id,
        serviceType: template.serviceType,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
        ...(project.estimatedHours === null && template.defaultEstimatedHours !== null
          ? { estimatedHours: template.defaultEstimatedHours }
          : {}),
        ...(project.targetEndDate === null && template.defaultDurationDays !== null
          ? { targetEndDate: addUtcDays(baseDate, template.defaultDurationDays) }
          : {}),
      };

      await this.projectRepository.update(scope, projectId, updateData, tx);

      await this.activityService.logSystemEvent(
        scope,
        {
          entityType: 'project',
          entityId: projectId,
          type: 'STATUS_CHANGED',
          title: 'Template Applied',
          description: `Project template "${template.name}" was applied.`,
          metadata: { templateId: template.id, templateName: template.name },
        },
        { actorUserId: context.actorUserId },
      );

      const updated = await this.projectRepository.findById(scope, projectId);
      if (updated === null) {
        throw new ProjectDomainError(
          PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
          'Project was not found.',
        );
      }

      return updated;
    });
  }

  private toTemplateScope(scope: ProjectScope): ProjectTemplateScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
    };
  }
}

function parseChecklistItems(checklistJson: unknown): readonly string[] {
  if (!Array.isArray(checklistJson)) {
    return [];
  }

  const titles: string[] = [];
  for (const item of checklistJson) {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.length > 0) {
        titles.push(trimmed);
      }
      continue;
    }

    if (item !== null && typeof item === 'object' && 'title' in item) {
      const title = String((item as { title: unknown }).title).trim();
      if (title.length > 0) {
        titles.push(title);
      }
    }
  }

  return titles;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

export type { ProjectTemplateRecord };
