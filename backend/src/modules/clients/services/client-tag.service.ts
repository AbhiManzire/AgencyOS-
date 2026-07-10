import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CLIENT_DOMAIN_ERROR_CODES, ClientDomainError } from '../domain/client-domain.errors';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
  type ClientScope,
} from '../repositories/client.repository.interface';
import {
  CLIENT_TAG_REPOSITORY,
  type ClientTagRecord,
  type ClientTagRepository,
  type ClientTagScope,
} from '../repositories/client-tag.repository.interface';
import type {
  AssignClientTagCommand,
  ClientTagApplicationContext,
  ClientTagResponse,
} from './client-tag-application.types';

@Injectable()
export class ClientTagService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(CLIENT_TAG_REPOSITORY)
    private readonly clientTagRepository: ClientTagRepository,
  ) {}

  async listTags(scope: ClientScope, clientId: string): Promise<readonly ClientTagResponse[]> {
    await this.requireClient(scope, clientId);
    const tags = await this.clientTagRepository.listByClient(this.toTagScope(scope, clientId));
    return tags.map(toClientTagResponse);
  }

  async assignTag(
    scope: ClientScope,
    clientId: string,
    command: AssignClientTagCommand,
    context: ClientTagApplicationContext,
  ): Promise<ClientTagResponse> {
    await this.requireClient(scope, clientId);

    const name = command.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Tag name is required.');
    }

    const tagScope = this.toTagScope(scope, clientId);
    const now = new Date();

    let tag = await this.clientTagRepository.findTagByName(scope, name);
    tag ??= await this.clientTagRepository.createTag(scope, {
      id: randomUUID(),
      name,
      colorToken: command.colorToken ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId || null,
      updatedByUserId: context.actorUserId || null,
    });

    const alreadyAssigned = await this.clientTagRepository.isAssigned(tagScope, tag.id);
    if (alreadyAssigned) {
      const existing = (await this.clientTagRepository.listByClient(tagScope)).find(
        (item) => item.id === tag.id,
      );
      if (existing !== undefined) {
        return toClientTagResponse(existing);
      }
    }

    const assigned = await this.clientTagRepository.assign(tagScope, tag.id, now);
    return toClientTagResponse(assigned);
  }

  async unassignTag(scope: ClientScope, clientId: string, tagId: string): Promise<void> {
    await this.requireClient(scope, clientId);
    const removed = await this.clientTagRepository.unassign(
      this.toTagScope(scope, clientId),
      tagId,
    );

    if (!removed) {
      throw new NotFoundException('Tag assignment was not found.');
    }
  }

  private async requireClient(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId, {
      includeArchived: true,
    });

    if (client === null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }
  }

  private toTagScope(scope: ClientScope, clientId: string): ClientTagScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId,
    };
  }
}

function toClientTagResponse(tag: ClientTagRecord): ClientTagResponse {
  return {
    id: tag.id,
    name: tag.name,
    colorToken: tag.colorToken,
    description: tag.description,
    assignedAt: tag.assignedAt.toISOString(),
  };
}
