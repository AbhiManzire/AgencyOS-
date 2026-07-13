import { Injectable } from '@nestjs/common';
import type { NotificationPriority } from '@prisma/client';
import type { NotificationRecord, NotificationScope } from '../notification.types';
import { NotificationService } from '../services/notification.service';
import {
  getNotificationEventCatalogEntry,
  renderNotificationTemplate,
  type NotificationEventKey,
} from './notification-event.catalog';

export interface ProjectNotificationEntityRef {
  readonly entityType?: string;
  readonly entityId?: string;
  readonly linkPath?: string;
}

@Injectable()
export class ProjectNotificationEmitter {
  constructor(private readonly notificationService: NotificationService) {}

  async emit(
    eventKey: NotificationEventKey,
    scope: NotificationScope,
    recipientUserId: string,
    vars: Readonly<Record<string, string | number | null | undefined>>,
    entity?: ProjectNotificationEntityRef,
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
