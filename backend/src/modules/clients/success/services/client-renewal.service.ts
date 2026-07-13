import { Inject, Injectable } from '@nestjs/common';
import {
  ActivityType,
  type ClientRenewalStatus,
  type ClientRenewalType,
  type Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { NOTIFICATION_EVENT_KEYS } from '../../../notifications/events/notification-event.catalog';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ClientApplicationContext } from '../../services/client-application.types';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { CLIENT_SUCCESS_ERROR_CODES, ClientSuccessError } from '../domain/client-success.errors';
import {
  CLIENT_RENEWAL_REPOSITORY,
  type ClientRenewalRecord,
  type ClientRenewalRepository,
  type CreateClientRenewalData,
  type ListClientRenewalsResult,
  type UpdateClientRenewalData,
} from '../repositories/client-renewal.repository.interface';

export interface CreateClientRenewalCommand {
  readonly type: ClientRenewalType;
  readonly title: string;
  readonly description?: string | null;
  readonly amount?: number | null;
  readonly currency?: string | null;
  readonly renewalDate: Date;
  readonly reminderDate?: Date | null;
  readonly autoNotify?: boolean;
  readonly status?: ClientRenewalStatus;
}

export interface UpdateClientRenewalCommand {
  readonly type?: ClientRenewalType;
  readonly title?: string;
  readonly description?: string | null;
  readonly amount?: number | null;
  readonly currency?: string | null;
  readonly renewalDate?: Date;
  readonly reminderDate?: Date | null;
  readonly autoNotify?: boolean;
  readonly status?: ClientRenewalStatus;
}

export interface ListClientRenewalsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly status?: ClientRenewalStatus;
}

@Injectable()
export class ClientRenewalService {
  constructor(
    @Inject(CLIENT_RENEWAL_REPOSITORY)
    private readonly renewalRepository: ClientRenewalRepository,
    private readonly activityService: ActivityService,
    private readonly prisma: PrismaService,
  ) {}

  async listRenewals(
    scope: ClientScope,
    clientId: string,
    query: ListClientRenewalsQuery = {},
  ): Promise<ListClientRenewalsResult> {
    await this.requireClient(scope, clientId);
    return this.renewalRepository.list({
      scope,
      clientId,
      skip: query.skip ?? 0,
      take: query.take ?? 50,
      status: query.status,
    });
  }

  async getRenewal(
    scope: ClientScope,
    clientId: string,
    renewalId: string,
  ): Promise<ClientRenewalRecord> {
    await this.requireClient(scope, clientId);
    const renewal = await this.renewalRepository.findById(scope, clientId, renewalId);
    if (renewal === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.RENEWAL_NOT_FOUND,
        'Renewal was not found.',
      );
    }
    return renewal;
  }

  async createRenewal(
    scope: ClientScope,
    clientId: string,
    command: CreateClientRenewalCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRenewalRecord> {
    const client = await this.requireClient(scope, clientId);
    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const renewalDate = toDateOnly(command.renewalDate);
    const reminderDate =
      command.reminderDate !== undefined && command.reminderDate !== null
        ? toDateOnly(command.reminderDate)
        : null;
    const autoNotify = command.autoNotify ?? true;
    const status = command.status ?? computeRenewalStatus(renewalDate, undefined);

    const renewalId = randomUUID();

    const created = await this.prisma.$transaction(async (tx) => {
      let reminderId: string | null = null;

      if (autoNotify && reminderDate !== null) {
        reminderId = await this.upsertRenewalReminder(tx, scope, {
          renewalId,
          clientId,
          title: command.title.trim(),
          reminderDate,
          assignedUserId: client.ownerUserId ?? actorUserId,
          actorUserId,
          existingReminderId: null,
        });
      }

      const data: CreateClientRenewalData = {
        id: renewalId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        clientId,
        type: command.type,
        title: command.title.trim(),
        description: normalizeOptionalString(command.description),
        amount: command.amount ?? null,
        currency:
          command.currency !== undefined && command.currency !== null
            ? command.currency.trim().toUpperCase()
            : null,
        renewalDate,
        reminderDate,
        autoNotify,
        status,
        reminderId,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actorUserId,
        updatedByUserId: actorUserId,
      };

      return this.renewalRepository.create(data, tx);
    });

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'client',
        entityId: clientId,
        type: ActivityType.RENEWAL_CREATED,
        title: 'Renewal created',
        description: created.title,
        metadata: { renewalId: created.id, type: created.type },
      },
      { actorUserId: actorUserId ?? '' },
    );

    return created;
  }

  async updateRenewal(
    scope: ClientScope,
    clientId: string,
    renewalId: string,
    command: UpdateClientRenewalCommand,
    context: ClientApplicationContext,
  ): Promise<ClientRenewalRecord> {
    const client = await this.requireClient(scope, clientId);
    const existing = await this.renewalRepository.findById(scope, clientId, renewalId);
    if (existing === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.RENEWAL_NOT_FOUND,
        'Renewal was not found.',
      );
    }

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);
    const renewalDate =
      command.renewalDate !== undefined ? toDateOnly(command.renewalDate) : existing.renewalDate;
    const reminderDate =
      command.reminderDate !== undefined
        ? command.reminderDate === null
          ? null
          : toDateOnly(command.reminderDate)
        : existing.reminderDate;
    const autoNotify = command.autoNotify ?? existing.autoNotify;
    const nextStatus = command.status ?? computeRenewalStatus(renewalDate, existing.status);

    const updated = await this.prisma.$transaction(async (tx) => {
      let reminderId = existing.reminderId;

      if (autoNotify && reminderDate !== null) {
        reminderId = await this.upsertRenewalReminder(tx, scope, {
          renewalId: existing.id,
          clientId,
          title: (command.title ?? existing.title).trim(),
          reminderDate,
          assignedUserId: client.ownerUserId ?? actorUserId,
          actorUserId,
          existingReminderId: existing.reminderId,
        });
      } else if ((!autoNotify || reminderDate === null) && existing.reminderId !== null) {
        await tx.reminder.updateMany({
          where: {
            id: existing.reminderId,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
          },
          data: {
            status: 'CANCELLED',
            updatedAt: now,
            updatedByUserId: actorUserId,
          },
        });
        reminderId = null;
      }

      const data: UpdateClientRenewalData = {
        updatedAt: now,
        updatedByUserId: actorUserId,
        ...(command.type !== undefined ? { type: command.type } : {}),
        ...(command.title !== undefined ? { title: command.title.trim() } : {}),
        ...(command.description !== undefined
          ? { description: normalizeOptionalString(command.description) }
          : {}),
        ...(command.amount !== undefined ? { amount: command.amount } : {}),
        ...(command.currency !== undefined
          ? {
              currency: command.currency === null ? null : command.currency.trim().toUpperCase(),
            }
          : {}),
        ...(command.renewalDate !== undefined ? { renewalDate } : {}),
        ...(command.reminderDate !== undefined ? { reminderDate } : {}),
        ...(command.autoNotify !== undefined ? { autoNotify } : {}),
        status: nextStatus,
        reminderId,
      };

      const result = await this.renewalRepository.update(scope, clientId, renewalId, data, tx);

      if (result === null) {
        throw new ClientSuccessError(
          CLIENT_SUCCESS_ERROR_CODES.RENEWAL_NOT_FOUND,
          'Renewal was not found.',
        );
      }

      return result;
    });

    await this.activityService.logSystemEvent(
      scope,
      {
        entityType: 'client',
        entityId: clientId,
        type: ActivityType.RENEWAL_UPDATED,
        title: 'Renewal updated',
        description: updated.title,
        metadata: { renewalId: updated.id, type: updated.type },
      },
      { actorUserId: actorUserId ?? '' },
    );

    return updated;
  }

  async deleteRenewal(
    scope: ClientScope,
    clientId: string,
    renewalId: string,
    context: ClientApplicationContext,
  ): Promise<ClientRenewalRecord> {
    await this.requireClient(scope, clientId);
    const existing = await this.renewalRepository.findById(scope, clientId, renewalId);
    if (existing === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.RENEWAL_NOT_FOUND,
        'Renewal was not found.',
      );
    }

    const now = new Date();
    const actorUserId = normalizeActorUserId(context.actorUserId);

    return this.prisma.$transaction(async (tx) => {
      if (existing.reminderId !== null) {
        await tx.reminder.updateMany({
          where: {
            id: existing.reminderId,
            tenantId: scope.tenantId,
            workspaceId: scope.workspaceId,
            deletedAt: null,
          },
          data: {
            status: 'CANCELLED',
            deletedAt: now,
            deletedByUserId: actorUserId,
            updatedAt: now,
            updatedByUserId: actorUserId,
          },
        });
      }

      const deleted = await this.renewalRepository.softDelete(
        scope,
        clientId,
        renewalId,
        {
          deletedAt: now,
          deletedByUserId: actorUserId,
          updatedAt: now,
          updatedByUserId: actorUserId,
        },
        tx,
      );

      if (deleted === null) {
        throw new ClientSuccessError(
          CLIENT_SUCCESS_ERROR_CODES.RENEWAL_NOT_FOUND,
          'Renewal was not found.',
        );
      }

      return deleted;
    });
  }

  private async upsertRenewalReminder(
    tx: Prisma.TransactionClient,
    scope: ClientScope,
    input: {
      renewalId: string;
      clientId: string;
      title: string;
      reminderDate: Date;
      assignedUserId: string | null;
      actorUserId: string | null;
      existingReminderId: string | null;
    },
  ): Promise<string | null> {
    if (input.assignedUserId === null) {
      return input.existingReminderId;
    }

    const now = new Date();
    const remindTime = '09:00';
    const remindAt = new Date(
      Date.UTC(
        input.reminderDate.getUTCFullYear(),
        input.reminderDate.getUTCMonth(),
        input.reminderDate.getUTCDate(),
        9,
        0,
        0,
        0,
      ),
    );

    if (input.existingReminderId !== null) {
      await tx.reminder.updateMany({
        where: {
          id: input.existingReminderId,
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
        },
        data: {
          title: `Renewal: ${input.title}`,
          body: `Renewal reminder for client ${input.clientId}`,
          remindDate: input.reminderDate,
          remindTime,
          remindAt,
          assignedUserId: input.assignedUserId,
          notificationEventKey: NOTIFICATION_EVENT_KEYS.RENEWAL_REMINDER,
          entityType: 'client_renewal',
          entityId: input.renewalId,
          status: 'PENDING',
          updatedAt: now,
          updatedByUserId: input.actorUserId,
        },
      });
      return input.existingReminderId;
    }

    const reminderId = randomUUID();
    await tx.reminder.create({
      data: {
        id: reminderId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        title: `Renewal: ${input.title}`,
        body: `Renewal reminder for client ${input.clientId}`,
        remindDate: input.reminderDate,
        remindTime,
        remindAt,
        recurrence: 'NONE',
        assignedUserId: input.assignedUserId,
        notificationEventKey: NOTIFICATION_EVENT_KEYS.RENEWAL_REMINDER,
        entityType: 'client_renewal',
        entityId: input.renewalId,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
        createdByUserId: input.actorUserId,
        updatedByUserId: input.actorUserId,
      },
    });

    return reminderId;
  }

  private async requireClient(
    scope: ClientScope,
    clientId: string,
  ): Promise<{ id: string; ownerUserId: string | null }> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true, ownerUserId: true },
    });

    if (client === null) {
      throw new ClientSuccessError(
        CLIENT_SUCCESS_ERROR_CODES.CLIENT_NOT_FOUND,
        'Client was not found.',
      );
    }

    return client;
  }
}

export function computeRenewalStatus(
  renewalDate: Date,
  currentStatus: ClientRenewalStatus | undefined,
): ClientRenewalStatus {
  if (currentStatus === 'CANCELLED' || currentStatus === 'RENEWED' || currentStatus === 'EXPIRED') {
    return currentStatus;
  }

  const today = startOfUtcDay(new Date());
  const renewalDay = startOfUtcDay(renewalDate);
  if (renewalDay < today) {
    return 'OVERDUE';
  }

  const inThirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (renewalDay <= inThirtyDays) {
    return 'UPCOMING';
  }

  return 'ACTIVE';
}

function toDateOnly(value: Date): Date {
  return startOfUtcDay(value);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeActorUserId(actorUserId: string | undefined): string | null {
  if (actorUserId === undefined || actorUserId.trim().length === 0) {
    return null;
  }
  return actorUserId;
}
