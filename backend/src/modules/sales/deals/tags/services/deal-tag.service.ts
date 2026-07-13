import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../../activities/services/activity.service';
import { DEAL_DOMAIN_ERROR_CODES, DealDomainError } from '../../domain/deal-domain.errors';
import {
  DEAL_REPOSITORY,
  type DealRepository,
  type DealScope,
} from '../../repositories/deal.repository.interface';
import {
  DEAL_TAG_REPOSITORY,
  type DealTagRecord,
  type DealTagRepository,
  type DealTagScope,
} from '../repositories/deal-tag.repository.interface';
import type {
  AssignDealTagCommand,
  DealTagApplicationContext,
  DealTagResponse,
} from './deal-tag-application.types';

@Injectable()
export class DealTagService {
  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    @Inject(DEAL_TAG_REPOSITORY)
    private readonly dealTagRepository: DealTagRepository,
    private readonly activityService: ActivityService,
  ) {}

  async listTags(scope: DealScope, dealId: string): Promise<readonly DealTagResponse[]> {
    await this.requireDeal(scope, dealId);
    const tags = await this.dealTagRepository.listByDeal(this.toTagScope(scope, dealId));
    return tags.map(toDealTagResponse);
  }

  async assignTag(
    scope: DealScope,
    dealId: string,
    command: AssignDealTagCommand,
    context: DealTagApplicationContext,
  ): Promise<DealTagResponse> {
    await this.requireDeal(scope, dealId);

    const name = command.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Tag name is required.');
    }

    const tagScope = this.toTagScope(scope, dealId);
    const now = new Date();

    let tag = await this.dealTagRepository.findTagByName(scope, name);
    tag ??= await this.dealTagRepository.createTag(scope, {
      id: randomUUID(),
      name,
      colorToken: command.colorToken ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId || null,
      updatedByUserId: context.actorUserId || null,
    });

    const alreadyAssigned = await this.dealTagRepository.isAssigned(tagScope, tag.id);
    if (alreadyAssigned) {
      const existing = (await this.dealTagRepository.listByDeal(tagScope)).find(
        (item) => item.id === tag.id,
      );
      if (existing !== undefined) {
        return toDealTagResponse(existing);
      }
    }

    const assigned = await this.dealTagRepository.assign(tagScope, tag.id, now);

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'deal',
        entityId: dealId,
        type: ActivityType.TAG_ADDED,
        title: 'Tag added',
        description: `Tag "${tag.name}" was assigned.`,
        dedupeKey: `deal.tag:${dealId}:${tag.id}`,
        metadata: { tagId: tag.id, tagName: tag.name },
      },
      { actorUserId: context.actorUserId },
    );

    return toDealTagResponse(assigned);
  }

  async unassignTag(scope: DealScope, dealId: string, tagId: string): Promise<void> {
    await this.requireDeal(scope, dealId);
    const removed = await this.dealTagRepository.unassign(this.toTagScope(scope, dealId), tagId);

    if (!removed) {
      throw new NotFoundException('Tag assignment was not found.');
    }
  }

  private async requireDeal(scope: DealScope, dealId: string): Promise<void> {
    const deal = await this.dealRepository.findById(scope, dealId, { includeArchived: true });

    if (deal === null) {
      throw new DealDomainError(DEAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND, 'Deal was not found.');
    }
  }

  private toTagScope(scope: DealScope, dealId: string): DealTagScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      dealId,
    };
  }
}

function toDealTagResponse(tag: DealTagRecord): DealTagResponse {
  return {
    id: tag.id,
    name: tag.name,
    colorToken: tag.colorToken,
    description: tag.description,
    assignedAt: tag.assignedAt.toISOString(),
  };
}
