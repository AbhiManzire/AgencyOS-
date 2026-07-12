import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientDomainService } from '../domain/client-domain.service';
import { CLIENT_DOMAIN_ERROR_CODES, ClientDomainError } from '../domain/client-domain.errors';
import type {
  ArchiveValidationContext,
  ClientMembershipContext,
} from '../domain/client-domain.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
  type ClientScope,
  type ClientTransactionClient,
  type CreateClientData,
  type FindByIdOptions,
  type UpdateClientData,
  type WorkspaceOwnerOption,
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
    const membership = await this.resolveMembership(scope, context);
    const actorUserId = normalizeActorUserId(context.actorUserId);

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
        phone: command.phone,
        gstin: command.gstin,
        pan: command.pan,
        currency: command.currency,
        countryCode: command.countryCode,
        shippingCountryCode: command.shippingCountryCode,
        ownerUserId: command.ownerUserId,
        externalReferenceId: command.externalReferenceId,
        source: command.source,
      },
      membership,
    );

    const now = new Date();
    const slug =
      command.slug ??
      (await this.clientDomainService.ensureUniqueSlug(
        scope,
        this.clientDomainService.generateSlug(command.displayName),
      ));

    return this.runInTransaction(async (tx) => {
      const clientCode = await this.allocateNextClientCode(scope, tx);

      const data: CreateClientData = {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        displayName: command.displayName.trim(),
        slug,
        status: command.status ?? 'PROSPECT',
        legalName: command.legalName,
        clientCode,
        industry: command.industry,
        website: command.website,
        phone: command.phone,
        email: command.email,
        gstin: normalizeUpperOptional(command.gstin),
        pan: normalizeUpperOptional(command.pan),
        currency: normalizeUpperOptional(command.currency),
        addressLine1: command.addressLine1,
        addressLine2: command.addressLine2,
        city: command.city,
        stateRegion: command.stateRegion,
        postalCode: command.postalCode,
        countryCode: normalizeCountryCode(command.countryCode),
        shippingAddressLine1: command.shippingAddressLine1,
        shippingAddressLine2: command.shippingAddressLine2,
        shippingCity: command.shippingCity,
        shippingStateRegion: command.shippingStateRegion,
        shippingPostalCode: command.shippingPostalCode,
        shippingCountryCode: normalizeCountryCode(command.shippingCountryCode),
        ownerUserId: command.ownerUserId,
        source: command.source,
        externalReferenceId: command.externalReferenceId,
        becameClientAt: command.becameClientAt,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      };

      const created = await this.clientRepository.create(data, tx);
      await this.recordActivity(tx, scope, created.id, 'client.created', 'Client created', {
        actorUserId: actorUserId ?? '',
      });
      return created;
    });
  }

  async updateClient(
    scope: ClientScope,
    clientId: string,
    command: UpdateClientCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.requireClient(scope, clientId, { includeArchived: true });
    const membership = await this.resolveMembership(scope, context);
    const actorUserId = normalizeActorUserId(context.actorUserId);

    await this.clientDomainService.validateUpdate(
      scope,
      existing,
      {
        displayName: command.displayName,
        slug: command.slug,
        status: command.status,
        website: command.website,
        email: command.email,
        phone: command.phone,
        gstin: command.gstin,
        pan: command.pan,
        currency: command.currency,
        countryCode: command.countryCode,
        shippingCountryCode: command.shippingCountryCode,
        ownerUserId: command.ownerUserId,
        externalReferenceId: command.externalReferenceId,
        source: command.source,
      },
      membership,
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
      ...(command.gstin !== undefined ? { gstin: normalizeUpperOptional(command.gstin) } : {}),
      ...(command.pan !== undefined ? { pan: normalizeUpperOptional(command.pan) } : {}),
      ...(command.currency !== undefined
        ? { currency: normalizeUpperOptional(command.currency) }
        : {}),
      ...(command.addressLine1 !== undefined ? { addressLine1: command.addressLine1 } : {}),
      ...(command.addressLine2 !== undefined ? { addressLine2: command.addressLine2 } : {}),
      ...(command.city !== undefined ? { city: command.city } : {}),
      ...(command.stateRegion !== undefined ? { stateRegion: command.stateRegion } : {}),
      ...(command.postalCode !== undefined ? { postalCode: command.postalCode } : {}),
      ...(command.countryCode !== undefined
        ? { countryCode: normalizeCountryCode(command.countryCode) }
        : {}),
      ...(command.shippingAddressLine1 !== undefined
        ? { shippingAddressLine1: command.shippingAddressLine1 }
        : {}),
      ...(command.shippingAddressLine2 !== undefined
        ? { shippingAddressLine2: command.shippingAddressLine2 }
        : {}),
      ...(command.shippingCity !== undefined ? { shippingCity: command.shippingCity } : {}),
      ...(command.shippingStateRegion !== undefined
        ? { shippingStateRegion: command.shippingStateRegion }
        : {}),
      ...(command.shippingPostalCode !== undefined
        ? { shippingPostalCode: command.shippingPostalCode }
        : {}),
      ...(command.shippingCountryCode !== undefined
        ? { shippingCountryCode: normalizeCountryCode(command.shippingCountryCode) }
        : {}),
      ...(command.ownerUserId !== undefined ? { ownerUserId: command.ownerUserId } : {}),
      ...(command.source !== undefined ? { source: command.source } : {}),
      ...(command.externalReferenceId !== undefined
        ? { externalReferenceId: command.externalReferenceId }
        : {}),
      ...(command.becameClientAt !== undefined ? { becameClientAt: command.becameClientAt } : {}),
      updatedAt: now,
      updatedByUserId: actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.clientRepository.update(scope, clientId, data, tx);
      if (updated === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      await this.recordActivity(tx, scope, updated.id, 'client.updated', 'Client updated', {
        actorUserId: actorUserId ?? '',
      });
      return updated;
    });
  }

  async archiveClient(
    scope: ClientScope,
    clientId: string,
    context: ClientApplicationContext,
  ): Promise<ClientRecord> {
    const existing = await this.requireClient(scope, clientId);
    const archive = await this.resolveArchiveContext(scope, clientId, context);
    const actorUserId = normalizeActorUserId(context.actorUserId);

    this.clientDomainService.validateArchive(scope, existing, archive);

    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.clientRepository.archive(
        scope,
        clientId,
        {
          status: 'ARCHIVED',
          deletedAt: now,
          deletedByUserId: actorUserId,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
        tx,
      );

      if (archived === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      await this.recordActivity(tx, scope, archived.id, 'client.archived', 'Client archived', {
        actorUserId: actorUserId ?? '',
      });
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

    const membership = await this.resolveMembership(scope, context);
    const actorUserId = normalizeActorUserId(context.actorUserId);

    await this.clientDomainService.validateRestore(
      scope,
      existing,
      { targetStatus: command.targetStatus },
      membership,
    );

    const now = new Date();
    const targetStatus = command.targetStatus ?? 'ACTIVE';

    return this.runInTransaction(async (tx) => {
      const restored = await this.clientRepository.restore(
        scope,
        clientId,
        {
          status: targetStatus,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
        tx,
      );

      if (restored === null) {
        throw new ClientDomainError(
          CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
          'Client was not found.',
        );
      }

      await this.recordActivity(tx, scope, restored.id, 'client.restored', 'Client restored', {
        actorUserId: actorUserId ?? '',
      });
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
      archivedOnly: query.archivedOnly,
      q: query.q,
      ownerUserId: query.ownerUserId,
      tagId: query.tagId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  async listWorkspaceOwners(scope: ClientScope): Promise<readonly WorkspaceOwnerOption[]> {
    return this.clientRepository.listWorkspaceOwners(scope);
  }

  /** Opens a Prisma transaction boundary for mutating use cases. */
  private async runInTransaction<T>(work: (tx: ClientTransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async recordActivity(
    tx: ClientTransactionClient,
    scope: ClientScope,
    clientId: string,
    type: string,
    title: string,
    context: ClientApplicationContext,
  ): Promise<void> {
    await tx.activity.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: 'client',
        entityId: clientId,
        userId: context.actorUserId || null,
        type,
        title,
        createdAt: new Date(),
      },
    });
  }

  private async resolveMembership(
    scope: ClientScope,
    context: ClientApplicationContext,
  ): Promise<ClientMembershipContext> {
    if (context.membership) {
      return context.membership;
    }

    const owners = await this.clientRepository.listWorkspaceOwners(scope);
    const memberIds = new Set(owners.map((owner) => owner.id));

    return {
      isWorkspaceMember: (userId: string) => memberIds.has(userId),
    };
  }

  private async resolveArchiveContext(
    scope: ClientScope,
    clientId: string,
    context: ClientApplicationContext,
  ): Promise<ArchiveValidationContext> {
    if (context.archive) {
      return context.archive;
    }

    const [activeProjects, openInvoices] = await Promise.all([
      this.clientRepository.countActiveProjects(scope, clientId),
      this.clientRepository.countOpenUnpaidInvoices(scope, clientId),
    ]);

    return {
      hasActiveProjects: activeProjects > 0,
      hasOpenUnpaidInvoices: openInvoices > 0,
      hasRunningCampaigns: false,
    };
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

  private async allocateNextClientCode(
    scope: ClientScope,
    tx: ClientTransactionClient,
  ): Promise<string> {
    const maxSequence = await this.clientRepository.findMaxClientCodeSequence(scope, tx);
    return this.clientDomainService.formatClientCode(maxSequence + 1);
  }
}

function normalizeActorUserId(value: string | undefined): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }
  return value;
}

function normalizeOptionalString(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUpperOptional(value: string | null | undefined): string | null | undefined {
  const normalized = normalizeOptionalString(value);
  if (normalized === undefined || normalized === null) {
    return normalized;
  }
  return normalized.toUpperCase();
}

function normalizeCountryCode(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
}
