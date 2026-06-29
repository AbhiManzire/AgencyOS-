import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientContactDomainService } from '../domain/client-contact-domain.service';
import {
  CLIENT_CONTACT_DOMAIN_ERROR_CODES,
  ClientContactDomainError,
} from '../domain/client-contact-domain.errors';
import { CLIENT_DOMAIN_ERROR_CODES, ClientDomainError } from '../domain/client-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
  type ClientScope,
} from '../repositories/client.repository.interface';
import {
  CLIENT_CONTACT_REPOSITORY,
  type ClientContactRecord,
  type ClientContactRepository,
  type ClientContactScope,
  type CreateClientContactData,
  type UpdateClientContactData,
} from '../repositories/client-contact.repository.interface';
import type {
  ClientContactApplicationContext,
  CreateClientContactCommand,
  UpdateClientContactCommand,
} from './client-contact-application.types';

/**
 * Application service — orchestrates client contact use cases, domain validation,
 * and persistence. Transaction boundaries are opened here for mutating flows.
 */
@Injectable()
export class ClientContactService {
  constructor(
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: ClientRepository,
    @Inject(CLIENT_CONTACT_REPOSITORY)
    private readonly clientContactRepository: ClientContactRepository,
    private readonly clientContactDomainService: ClientContactDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listContacts(
    scope: ClientScope,
    clientId: string,
  ): Promise<readonly ClientContactRecord[]> {
    await this.requireClientForRead(scope, clientId);

    return this.clientContactRepository.listByClient(this.toContactScope(scope, clientId));
  }

  async createContact(
    scope: ClientScope,
    clientId: string,
    command: CreateClientContactCommand,
    context: ClientContactApplicationContext,
  ): Promise<ClientContactRecord> {
    await this.requireClientForMutation(scope, clientId);

    this.clientContactDomainService.validateCreate({
      firstName: command.firstName,
      email: command.email,
      status: command.status,
      isPrimary: command.isPrimary,
    });

    const now = new Date();
    const contactScope = this.toContactScope(scope, clientId);
    const isPrimary = command.isPrimary ?? false;

    return this.prisma.$transaction(async () => {
      if (isPrimary) {
        await this.clientContactRepository.unsetPrimaryForClient(contactScope, {
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        });
      }

      const data: CreateClientContactData = {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId,
        firstName: this.clientContactDomainService.normalizeFirstName(command.firstName),
        lastName: this.clientContactDomainService.normalizeOptionalString(command.lastName),
        jobTitle: this.clientContactDomainService.normalizeOptionalString(command.jobTitle),
        department: this.clientContactDomainService.normalizeOptionalString(command.department),
        email: this.clientContactDomainService.normalizeOptionalString(command.email),
        mobile: this.clientContactDomainService.normalizeOptionalString(command.mobile),
        phone: this.clientContactDomainService.normalizeOptionalString(command.phone),
        isPrimary,
        isDecisionMaker: command.isDecisionMaker ?? false,
        status: command.status ?? 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        createdByUserId: context.actorUserId,
        updatedByUserId: context.actorUserId,
      };

      return this.clientContactRepository.create(data);
    });
  }

  async updateContact(
    scope: ClientScope,
    clientId: string,
    contactId: string,
    command: UpdateClientContactCommand,
    context: ClientContactApplicationContext,
  ): Promise<ClientContactRecord> {
    await this.requireClientForMutation(scope, clientId);

    const contactScope = this.toContactScope(scope, clientId);
    const existing = await this.clientContactRepository.findById(contactScope, contactId);

    if (!existing) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND,
        'Client contact was not found.',
      );
    }

    this.clientContactDomainService.validateUpdate({
      firstName: command.firstName,
      email: command.email,
      status: command.status,
      isPrimary: command.isPrimary,
    });

    const now = new Date();
    const updateData: UpdateClientContactData = {
      updatedAt: now,
      updatedByUserId: context.actorUserId,
      ...(command.firstName !== undefined
        ? { firstName: this.clientContactDomainService.normalizeFirstName(command.firstName) }
        : {}),
      ...(command.lastName !== undefined
        ? { lastName: this.clientContactDomainService.normalizeOptionalString(command.lastName) }
        : {}),
      ...(command.jobTitle !== undefined
        ? { jobTitle: this.clientContactDomainService.normalizeOptionalString(command.jobTitle) }
        : {}),
      ...(command.department !== undefined
        ? {
            department: this.clientContactDomainService.normalizeOptionalString(command.department),
          }
        : {}),
      ...(command.email !== undefined
        ? { email: this.clientContactDomainService.normalizeOptionalString(command.email) }
        : {}),
      ...(command.mobile !== undefined
        ? { mobile: this.clientContactDomainService.normalizeOptionalString(command.mobile) }
        : {}),
      ...(command.phone !== undefined
        ? { phone: this.clientContactDomainService.normalizeOptionalString(command.phone) }
        : {}),
      ...(command.isPrimary !== undefined ? { isPrimary: command.isPrimary } : {}),
      ...(command.isDecisionMaker !== undefined
        ? { isDecisionMaker: command.isDecisionMaker }
        : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
    };

    return this.prisma.$transaction(async () => {
      if (command.isPrimary === true) {
        await this.clientContactRepository.unsetPrimaryForClient(
          contactScope,
          {
            updatedAt: now,
            updatedByUserId: context.actorUserId,
          },
          contactId,
        );
      }

      const updated = await this.clientContactRepository.update(
        contactScope,
        contactId,
        updateData,
      );

      if (!updated) {
        throw new ClientContactDomainError(
          CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND,
          'Client contact was not found.',
        );
      }

      return updated;
    });
  }

  async deleteContact(
    scope: ClientScope,
    clientId: string,
    contactId: string,
    context: ClientContactApplicationContext,
  ): Promise<ClientContactRecord> {
    await this.requireClientForMutation(scope, clientId);

    const contactScope = this.toContactScope(scope, clientId);
    const existing = await this.clientContactRepository.findById(contactScope, contactId);

    if (!existing) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND,
        'Client contact was not found.',
      );
    }

    const now = new Date();
    const deleted = await this.clientContactRepository.softDelete(contactScope, contactId, {
      deletedAt: now,
      deletedByUserId: context.actorUserId,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    });

    if (!deleted) {
      throw new ClientContactDomainError(
        CLIENT_CONTACT_DOMAIN_ERROR_CODES.CLIENT_CONTACT_NOT_FOUND,
        'Client contact was not found.',
      );
    }

    return deleted;
  }

  private toContactScope(scope: ClientScope, clientId: string): ClientContactScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      clientId,
    };
  }

  private async requireClientForRead(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId, {
      includeArchived: true,
    });

    if (!client) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found in this workspace.',
      );
    }
  }

  private async requireClientForMutation(scope: ClientScope, clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(scope, clientId, {
      includeArchived: true,
    });

    if (!client) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found in this workspace.',
      );
    }

    if (client.deletedAt !== null) {
      throw new ClientDomainError(
        CLIENT_DOMAIN_ERROR_CODES.CLIENT_ARCHIVED,
        'Contacts cannot be modified while the client is archived.',
      );
    }
  }
}
