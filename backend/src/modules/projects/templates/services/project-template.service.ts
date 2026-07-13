import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_PROJECT_TEMPLATES } from '../domain/default-template.catalog';
import {
  PROJECT_TEMPLATE_DOMAIN_ERROR_CODES,
  ProjectTemplateDomainError,
} from '../domain/project-template-domain.errors';
import {
  PROJECT_TEMPLATE_REPOSITORY,
  type CreateProjectTemplateData,
  type ProjectTemplateRecord,
  type ProjectTemplateRepository,
  type ProjectTemplateScope,
  type UpdateProjectTemplateData,
} from '../repositories/project-template.repository.interface';
import type {
  CreateProjectTemplateCommand,
  ProjectTemplateApplicationContext,
  UpdateProjectTemplateCommand,
} from './project-template-application.types';

@Injectable()
export class ProjectTemplateService {
  constructor(
    @Inject(PROJECT_TEMPLATE_REPOSITORY)
    private readonly templateRepository: ProjectTemplateRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createTemplate(
    scope: ProjectTemplateScope,
    command: CreateProjectTemplateCommand,
    context: ProjectTemplateApplicationContext,
  ): Promise<ProjectTemplateRecord> {
    const name = this.requireName(command.name);
    await this.assertNameUnique(scope, name);

    const now = new Date();
    const data: CreateProjectTemplateData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      name,
      description: command.description ?? null,
      serviceType: command.serviceType,
      defaultDurationDays: command.defaultDurationDays ?? null,
      defaultEstimatedHours: command.defaultEstimatedHours ?? null,
      isActive: command.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
      milestones: command.milestones,
      tasks: command.tasks,
      deliverables: command.deliverables,
      requiredDocuments: command.requiredDocuments,
    };

    return this.prisma.$transaction((tx) => this.templateRepository.create(data, tx));
  }

  async updateTemplate(
    scope: ProjectTemplateScope,
    id: string,
    command: UpdateProjectTemplateCommand,
    context: ProjectTemplateApplicationContext,
  ): Promise<ProjectTemplateRecord> {
    const existing = await this.requireTemplate(scope, id);

    if (command.name !== undefined) {
      const name = this.requireName(command.name);
      await this.assertNameUnique(scope, name, id);
    }

    const hasNestedChildren =
      command.milestones !== undefined ||
      command.tasks !== undefined ||
      command.deliverables !== undefined ||
      command.requiredDocuments !== undefined;

    const now = new Date();
    const data: UpdateProjectTemplateData = {
      ...(command.name !== undefined ? { name: this.requireName(command.name) } : {}),
      ...(command.description !== undefined ? { description: command.description } : {}),
      ...(command.serviceType !== undefined ? { serviceType: command.serviceType } : {}),
      ...(command.defaultDurationDays !== undefined
        ? { defaultDurationDays: command.defaultDurationDays }
        : {}),
      ...(command.defaultEstimatedHours !== undefined
        ? { defaultEstimatedHours: command.defaultEstimatedHours }
        : {}),
      ...(command.isActive !== undefined ? { isActive: command.isActive } : {}),
      ...(hasNestedChildren
        ? {
            replaceChildren: true,
            milestones: command.milestones,
            tasks: command.tasks,
            deliverables: command.deliverables,
            requiredDocuments: command.requiredDocuments,
          }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.templateRepository.update(scope, id, data, tx);
      if (updated === null) {
        throw new ProjectTemplateDomainError(
          PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NOT_FOUND,
          'Project template was not found.',
        );
      }

      if (existing.deletedAt !== null) {
        throw new ProjectTemplateDomainError(
          PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_ARCHIVED,
          'Project template is archived.',
        );
      }

      return updated;
    });
  }

  async getTemplate(scope: ProjectTemplateScope, id: string): Promise<ProjectTemplateRecord> {
    const template = await this.templateRepository.findById(scope, id);
    if (template?.deletedAt !== null) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NOT_FOUND,
        'Project template was not found.',
      );
    }
    return template;
  }

  async listTemplates(
    scope: ProjectTemplateScope,
    context: ProjectTemplateApplicationContext,
  ): Promise<readonly ProjectTemplateRecord[]> {
    const count = await this.templateRepository.countActive(scope);
    if (count === 0) {
      await this.ensureDefaultTemplates(scope, context);
    }
    return this.templateRepository.list(scope);
  }

  async archiveTemplate(
    scope: ProjectTemplateScope,
    id: string,
    context: ProjectTemplateApplicationContext,
  ): Promise<ProjectTemplateRecord> {
    await this.requireTemplate(scope, id);
    const now = new Date();

    const archived = await this.templateRepository.softDelete(
      scope,
      id,
      now,
      context.actorUserId || null,
    );

    if (archived === null) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NOT_FOUND,
        'Project template was not found.',
      );
    }

    return archived;
  }

  async ensureDefaultTemplates(
    scope: ProjectTemplateScope,
    context: ProjectTemplateApplicationContext,
  ): Promise<void> {
    const count = await this.templateRepository.countActive(scope);
    if (count > 0) {
      return;
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const definition of DEFAULT_PROJECT_TEMPLATES) {
        await this.templateRepository.create(
          {
            id: randomUUID(),
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            name: definition.name,
            description: definition.description,
            serviceType: definition.serviceType,
            defaultDurationDays: definition.defaultDurationDays,
            defaultEstimatedHours: definition.defaultEstimatedHours,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            createdByUserId: context.actorUserId,
            updatedByUserId: context.actorUserId,
            milestones: [...definition.milestones],
            tasks: [...definition.tasks],
            deliverables: [...definition.deliverables],
            requiredDocuments: [...definition.requiredDocuments],
          },
          tx,
        );
      }
    });
  }

  private requireName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NAME_REQUIRED,
        'Template name is required.',
      );
    }
    return trimmed;
  }

  private async assertNameUnique(
    scope: ProjectTemplateScope,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.templateRepository.findByName(scope, name);
    if (existing !== null && existing.id !== excludeId) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NAME_NOT_UNIQUE,
        'A template with this name already exists.',
      );
    }
  }

  private async requireTemplate(
    scope: ProjectTemplateScope,
    id: string,
  ): Promise<ProjectTemplateRecord> {
    const template = await this.templateRepository.findById(scope, id, { includeDeleted: true });
    if (template === null) {
      throw new ProjectTemplateDomainError(
        PROJECT_TEMPLATE_DOMAIN_ERROR_CODES.TEMPLATE_NOT_FOUND,
        'Project template was not found.',
      );
    }
    return template;
  }
}
