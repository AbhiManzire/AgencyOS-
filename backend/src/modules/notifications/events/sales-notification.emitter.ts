import { Injectable } from '@nestjs/common';
import type { NotificationPriority } from '@prisma/client';
import type { NotificationRecord, NotificationScope } from '../notification.types';
import { NotificationService } from '../services/notification.service';
import {
  getNotificationEventCatalogEntry,
  NOTIFICATION_EVENT_KEYS,
  renderNotificationTemplate,
  type NotificationEventKey,
} from './notification-event.catalog';

export interface SalesNotificationEntityRef {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly linkPath?: string;
}

export interface EmitNewLeadAssignedInput {
  readonly scope: NotificationScope;
  readonly recipientUserId: string;
  readonly company: string;
  readonly contactPerson?: string | null;
  readonly leadId: string;
  readonly linkPath?: string;
  readonly priority?: NotificationPriority;
}

export interface EmitFromReminderInput {
  readonly scope: NotificationScope;
  readonly recipientUserId: string;
  readonly notificationEventKey: string;
  readonly title: string;
  readonly body?: string | null;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly linkPath?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

@Injectable()
export class SalesNotificationEmitter {
  constructor(private readonly notificationService: NotificationService) {}

  async emitNewLeadAssigned(input: EmitNewLeadAssignedInput): Promise<NotificationRecord> {
    const contactSuffix =
      input.contactPerson !== null &&
      input.contactPerson !== undefined &&
      input.contactPerson.trim().length > 0
        ? ` (${input.contactPerson.trim()})`
        : '';

    return this.emit(
      NOTIFICATION_EVENT_KEYS.NEW_LEAD_ASSIGNED,
      input.scope,
      input.recipientUserId,
      {
        company: input.company,
        contactSuffix,
      },
      {
        entityType: 'Lead',
        entityId: input.leadId,
        linkPath: input.linkPath ?? `/sales/leads/${input.leadId}`,
      },
      input.priority,
    );
  }

  async emitFromReminder(input: EmitFromReminderInput): Promise<NotificationRecord | null> {
    const entry = getNotificationEventCatalogEntry(input.notificationEventKey);
    if (entry === null) {
      const trimmedBody = input.body?.trim();
      return this.notificationService.create(input.scope, {
        recipientUserId: input.recipientUserId,
        category: 'SALES',
        priority: 'NORMAL',
        title: input.title,
        body: trimmedBody !== undefined && trimmedBody.length > 0 ? trimmedBody : input.title,
        entityType: input.entityType ?? undefined,
        entityId: input.entityId ?? undefined,
        linkPath: input.linkPath,
        metadata: {
          notificationEventKey: input.notificationEventKey,
          ...(input.metadata ?? {}),
        },
      });
    }

    return this.emit(
      entry.key,
      input.scope,
      input.recipientUserId,
      {
        title: input.title,
        subject: input.title,
        body: input.body ?? '',
        timeSuffix: '',
        dueSuffix: '',
        amountSuffix: '',
        contactSuffix: '',
        company: input.title,
      },
      {
        entityType: input.entityType ?? undefined,
        entityId: input.entityId ?? undefined,
        linkPath: input.linkPath,
      },
    );
  }

  async emit(
    eventKey: NotificationEventKey,
    scope: NotificationScope,
    recipientUserId: string,
    vars: Readonly<Record<string, string | number | null | undefined>>,
    entity?: SalesNotificationEntityRef,
    priority?: NotificationPriority,
  ): Promise<NotificationRecord> {
    const entry = getNotificationEventCatalogEntry(eventKey);
    if (entry === null) {
      throw new Error(`Unknown notification event key: ${eventKey}`);
    }

    const title = renderNotificationTemplate(entry.titleTemplate, vars).trim() || entry.key;
    const body = renderNotificationTemplate(entry.bodyTemplate, vars).trim() || title;

    return this.notificationService.create(scope, {
      recipientUserId,
      category: entry.category,
      priority: priority ?? entry.defaultPriority,
      title,
      body,
      entityType: entity?.entityType,
      entityId: entity?.entityId,
      linkPath: entity?.linkPath,
      metadata: {
        notificationEventKey: entry.key,
      },
    });
  }
}
