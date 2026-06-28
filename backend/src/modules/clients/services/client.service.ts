import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientDomainService } from '../domain/client-domain.service';
import { CLIENT_DOMAIN_ERROR_CODES, ClientDomainError } from '../domain/client-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
  type ClientScope,
  type CreateClientData,
  type FindByIdOptions,
  type UpdateClientData,
} from '../repositories/client.repository.interface';
import type {
  ClientApplicationContext,
  ClientRecord,
  CreateClientCommand,
  GetClientOptions,
  ListClientsQuery,
  ListClientsResult,
  RestoreClientCommand,
  UpdateClientCommand,
} from './client-application.types';

/**
 * Application service — orchestrates client use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class ClientService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    private readonly clientDomainService: ClientDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async createClient(
    scope: ClientScope,
    command: CreateClientCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    await this.clientDomainService.validateCreate(
      scope,
      {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        displayName: command.displayName,
        slug: command.slug,
        status: command.status,
        website: command.website,
        email: command.email,
        countryCode: command.countryCode,
        ownerUserId: command.ownerUserId,
        externalReferenceId: command.externalReferenceId,
        source: command.source,
      },
      context.membership,
    );

    const now = new Date();
    const slug =
      command.slug ??
      (await this.clientDomainService.ensureUniqueSlug(
        scope,
        this.clientDomainService.generateSlug(command.displayName),
      ));

    const data: CreateClientData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      displayName: command.displayName.trim(),
      slug,
      status: command.status ?? 'PROSPECT',
      legalName: command.legalName,
      industry: command.industry,
      website: command.website,
      phone: command.phone,
      email: command.email,
      addressLine1: command.addressLine1,
      addressLine2: command.addressLine2,
      city: command.city,
      stateRegion: command.stateRegion,
      postalCode: command.postalCode,
      countryCode: command.countryCode?.trim().toUpperCase() ?? command.countryCode,
      ownerUserId: command.ownerUserId,
      source: command.source,
      externalReferenceId: command.externalReferenceId,
      becameClientAt: command.becameClientAt,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.clientRepository.create(data));
  }

  async updateClient(
    scope: ClientScope,
    clientId: string,
    command: UpdateClientCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.requireClient(scope, clientId, { includeArchived: true });

    await this.clientDomainService.validateUpdate(
      scope,
      existing,
      {
        displayName: command.displayName,
        slug: command.slug,
        status: command.status,
        website: command.website,
        email: command.email,
        countryCode: command.countryCode,
        ownerUserId: command.ownerUserId,
        externalReferenceId: command.externalReferenceId,
        source: command.source,
      },
      context.membership,
    );

    const now = new Date();
    const slug = await this.resolveUpdatedSlug(scope, existing, command);

    const data: UpdateClientData = {
      ...(command.displayName !== undefined ? { displayName: command.displayName.trim() } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      ...(command.legalName !== undefined ? { legalName: command.legalName } : {}),
      ...(command.industry !== undefined ? { industry: command.industry } : {}),
      ...(command.website !== undefined ? { website: command.website } : {}),
      ...(command.phone !== undefined ? { phone: command.phone } : {}),
      ...(command.email !== undefined ? { email: command.email } : {}),
      ...(command.addressLine1 !== undefined ? { addressLine1: command.addressLine1 } : {}),
      ...(command.addressLine2 !== undefined ? { addressLine2: command.addressLine2 } : {}),
      ...(command.city !== undefined ? { city: command.city } : {}),
      ...(command.stateRegion !== undefined ? { stateRegion: command.stateRegion } : {}),
      ...(command.postalCode !== undefined ? { postalCode: command.postalCode } : {}),
      ...(command.countryCode !== undefined
        ? {
            countryCode:
              command.countryCode === null ? null : command.countryCode.trim().toUpperCase(),
          }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.externalReferenceId !== undefined
        ? { externalReferenceId: command.externalReferenceId }
        : {}),
      ...(command.becameClientAt !== undefined ? { becameClientAt: command.becameClientAt } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.clientRepository.update(scope, clientId, data);
      if (updated === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      return updated;
    });
  }

  async archiveClient(
    scope: ClientScope,
    clientId: string,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.requireClient(scope, clientId);

    this.clientDomainService.validateArchive(scope, existing, context.archive);

    const now = new Date();

    return this.runInTransaction(async () => {
      const archived = await this.clientRepository.archive(scope, clientId, {
        status: 'ARCHIVED',
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (archived === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      // Contact and document soft-delete cascade is added in a follow-up within this boundary.
      return archived;
    });
  }

  async restoreClient(
    scope: ClientScope,
    clientId: string,
    command: RestoreClientCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.clientRepository.findById(scope, clientId, {
      includeArchived: true,
    });

    if (existing === null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    await this.clientDomainService.validateRestore(
      scope,
      existing,
      { targetStatus: command.targetStatus },
      context.membership,
    );

    const now = new Date();
    const targetStatus = command.targetStatus ?? 'ACTIVE';

    return this.runInTransaction(async () => {
      const restored = await this.clientRepository.restore(scope, clientId, {
        status: targetStatus,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (restored === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      // Contact and document restore cascade is added in a follow-up within this boundary.
      return restored;
    });
  }

  async getClient(
    scope: ClientScope,
    clientId: string,
    options: GetClientOptions = {},
  ): Promise<ClientRecord> {
    const client = await this.clientRepository.findById(scope, clientId, {
      includeArchived: options.includeArchived,
    });

    if (client === null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    this.clientDomainService.ensureWorkspaceOwnership(scope, client);
    return client;
  }

  async listClients(scope: ClientScope, query: ListClientsQuery = {}): Promise<ListClientsResult> {
    return this.clientRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      status: query.status,
      includeArchived: query.includeArchived,
    });
  }

  /** Opens a Prisma transaction boundary for mutating use cases. */
  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async requireClient(
    scope: ClientScope,
    clientId: string,
    options?: FindByIdOptions,
  ): Promise<ClientRecord> {
    const client = await this.clientRepository.findById(scope, clientId, options);

    if (client === null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    return client;
  }

  private async resolveUpdatedSlug(
    scope: ClientScope,
    existing: ClientRecord,
    command: UpdateClientCommand,
  ): Promise<string | undefined> {
    if (command.slug !== undefined) {
      return command.slug;
    }

    if (command.displayName !== undefined) {
      return this.clientDomainService.ensureUniqueSlug(
        scope,
        this.clientDomainService.generateSlug(command.displayName),
        existing.id,
      );
    }

    return undefined;
  }
}
