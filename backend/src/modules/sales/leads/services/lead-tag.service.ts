import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { LEAD_DOMAIN_ERROR_CODES, LeadDomainError } from '../domain/lead-domain.errors';
import {
  LEAD_TAG_REPOSITORY,
  type LeadTagRecord,
  type LeadTagRepository,
  type LeadTagScope,
} from '../repositories/lead-tag.repository.interface';
import {
  LEAD_REPOSITORY,
  type LeadRepository,
  type LeadScope,
} from '../repositories/lead.repository.interface';
import type {
  AssignLeadTagCommand,
  LeadTagApplicationContext,
  LeadTagResponse,
} from './lead-tag-application.types';

@Injectable()
export class LeadTagService {
  constructor(
    @Inject(LEAD_REPOSITORY)
    private readonly leadRepository: LeadRepository,
    @Inject(LEAD_TAG_REPOSITORY)
    private readonly leadTagRepository: LeadTagRepository,
    private readonly activityService: ActivityService,
  ) {}

  async listTags(scope: LeadScope, leadId: string): Promise<readonly LeadTagResponse[]> {
    await this.requireLead(scope, leadId);
    const tags = await this.leadTagRepository.listByLead(this.toTagScope(scope, leadId));
    return tags.map(toLeadTagResponse);
  }

  async assignTag(
    scope: LeadScope,
    leadId: string,
    command: AssignLeadTagCommand,
    context: LeadTagApplicationContext,
  ): Promise<LeadTagResponse> {
    await this.requireLead(scope, leadId);

    const name = command.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Tag name is required.');
    }

    const tagScope = this.toTagScope(scope, leadId);
    const now = new Date();

    let tag = await this.leadTagRepository.findTagByName(scope, name);
    tag ??= await this.leadTagRepository.createTag(scope, {
      id: randomUUID(),
      name,
      colorToken: command.colorToken ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId || null,
      updatedByUserId: context.actorUserId || null,
    });

    const alreadyAssigned = await this.leadTagRepository.isAssigned(tagScope, tag.id);
    if (alreadyAssigned) {
      const existing = (await this.leadTagRepository.listByLead(tagScope)).find(
        (item) => item.id === tag.id,
      );
      if (existing !== undefined) {
        return toLeadTagResponse(existing);
      }
    }

    const assigned = await this.leadTagRepository.assign(tagScope, tag.id, now);

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'lead',
        entityId: leadId,
        type: ActivityType.TAG_ADDED,
        title: 'Tag added',
        description: `Tag "${tag.name}" was assigned.`,
        dedupeKey: `lead.tag:${leadId}:${tag.id}`,
        metadata: { tagId: tag.id, tagName: tag.name },
      },
      { actorUserId: context.actorUserId },
    );

    return toLeadTagResponse(assigned);
  }

  async unassignTag(scope: LeadScope, leadId: string, tagId: string): Promise<void> {
    await this.requireLead(scope, leadId);
    const removed = await this.leadTagRepository.unassign(this.toTagScope(scope, leadId), tagId);

    if (!removed) {
      throw new NotFoundException('Tag assignment was not found.');
    }
  }

  private async requireLead(scope: LeadScope, leadId: string): Promise<void> {
    const lead = await this.leadRepository.findById(scope, leadId, { includeArchived: true });

    if (lead === null) {
      throw new LeadDomainError(LEAD_DOMAIN_ERROR_CODES.LEAD_NOT_FOUND, 'Lead was not found.');
    }
  }

  private toTagScope(scope: LeadScope, leadId: string): LeadTagScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      leadId,
    };
  }
}

function toLeadTagResponse(tag: LeadTagRecord): LeadTagResponse {
  return {
    id: tag.id,
    name: tag.name,
    colorToken: tag.colorToken,
    description: tag.description,
    assignedAt: tag.assignedAt.toISOString(),
  };
}
