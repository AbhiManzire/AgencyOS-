import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../domain/project-domain.errors';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
  type ProjectScope,
} from '../repositories/project.repository.interface';
import {
  PROJECT_TAG_REPOSITORY,
  type ProjectTagRecord,
  type ProjectTagRepository,
  type ProjectTagScope,
} from '../repositories/project-tag.repository.interface';
import type {
  AssignProjectTagCommand,
  ProjectTagApplicationContext,
  ProjectTagResponse,
} from './project-tag-application.types';

@Injectable()
export class ProjectTagService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_TAG_REPOSITORY)
    private readonly projectTagRepository: ProjectTagRepository,
  ) {}

  async listTags(scope: ProjectScope, projectId: string): Promise<readonly ProjectTagResponse[]> {
    await this.requireProject(scope, projectId);
    const tags = await this.projectTagRepository.listByProject(this.toTagScope(scope, projectId));
    return tags.map(toProjectTagResponse);
  }

  async assignTag(
    scope: ProjectScope,
    projectId: string,
    command: AssignProjectTagCommand,
    context: ProjectTagApplicationContext,
  ): Promise<ProjectTagResponse> {
    await this.requireProject(scope, projectId);

    const name = command.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Tag name is required.');
    }

    const tagScope = this.toTagScope(scope, projectId);
    const now = new Date();

    let tag = await this.projectTagRepository.findTagByName(scope, name);
    tag ??= await this.projectTagRepository.createTag(scope, {
      id: randomUUID(),
      name,
      colorToken: command.colorToken ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId || null,
      updatedByUserId: context.actorUserId || null,
    });

    const alreadyAssigned = await this.projectTagRepository.isAssigned(tagScope, tag.id);
    if (alreadyAssigned) {
      const existing = (await this.projectTagRepository.listByProject(tagScope)).find(
        (item) => item.id === tag.id,
      );
      if (existing !== undefined) {
        return toProjectTagResponse(existing);
      }
    }

    const assigned = await this.projectTagRepository.assign(tagScope, tag.id, now);
    return toProjectTagResponse(assigned);
  }

  async unassignTag(scope: ProjectScope, projectId: string, tagId: string): Promise<void> {
    await this.requireProject(scope, projectId);
    const removed = await this.projectTagRepository.unassign(
      this.toTagScope(scope, projectId),
      tagId,
    );

    if (!removed) {
      throw new NotFoundException('Tag assignment was not found.');
    }
  }

  private async requireProject(scope: ProjectScope, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId, {
      includeArchived: true,
    });

    if (project === null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }
  }

  private toTagScope(scope: ProjectScope, projectId: string): ProjectTagScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
    };
  }
}

function toProjectTagResponse(tag: ProjectTagRecord): ProjectTagResponse {
  return {
    id: tag.id,
    name: tag.name,
    colorToken: tag.colorToken,
    description: tag.description,
    assignedAt: tag.assignedAt.toISOString(),
  };
}
