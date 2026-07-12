import { Injectable } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';
import { NotificationPriority } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateNotificationInput,
  ListNotificationsParams,
  ListNotificationsResult,
  NotificationRecord,
  NotificationScope,
} from '../notification.types';
import type { NotificationRepository } from './notification.repository.interface';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    scope: NotificationScope,
    input: CreateNotificationInput,
  ): Promise<NotificationRecord> {
    const now = new Date();
    const created = await this.prisma.notification.create({
      data: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        recipientUserId: input.recipientUserId,
        category: input.category,
        priority: input.priority ?? NotificationPriority.NORMAL,
        title: input.title,
        body: input.body,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        linkPath: input.linkPath ?? null,
        emailReady: input.emailReady ?? false,
        metadata: input.metadata ?? undefined,
        createdAt: now,
        updatedAt: now,
      },
    });

    return toNotificationRecord(created);
  }

  async list(params: ListNotificationsParams): Promise<ListNotificationsResult> {
    const { scope, recipientUserId, category, isRead, skip, take } = params;

    const where: Prisma.NotificationWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      recipientUserId,
      deletedAt: null,
      ...(category !== undefined ? { category } : {}),
      ...(isRead !== undefined ? { isRead } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map(toNotificationRecord),
      total,
    };
  }

  async unreadCount(scope: NotificationScope, recipientUserId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        recipientUserId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  async findByIdForRecipient(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
  ): Promise<NotificationRecord | null> {
    const row = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        recipientUserId,
        deletedAt: null,
      },
    });

    return row === null ? null : toNotificationRecord(row);
  }

  async markRead(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
    readAt: Date,
  ): Promise<NotificationRecord | null> {
    const existing = await this.findByIdForRecipient(scope, id, recipientUserId);
    if (existing === null) {
      return null;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt,
        updatedAt: readAt,
      },
    });

    return toNotificationRecord(updated);
  }

  async markAllRead(
    scope: NotificationScope,
    recipientUserId: string,
    readAt: Date,
  ): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        recipientUserId,
        isRead: false,
        deletedAt: null,
      },
      data: {
        isRead: true,
        readAt,
        updatedAt: readAt,
      },
    });

    return result.count;
  }

  async archive(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
    deletedAt: Date,
  ): Promise<NotificationRecord | null> {
    const existing = await this.findByIdForRecipient(scope, id, recipientUserId);
    if (existing === null) {
      return null;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        deletedAt,
        updatedAt: deletedAt,
      },
    });

    return toNotificationRecord(updated);
  }
}

function toNotificationRecord(row: Notification): NotificationRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    recipientUserId: row.recipientUserId,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    entityType: row.entityType,
    entityId: row.entityId,
    linkPath: row.linkPath,
    isRead: row.isRead,
    readAt: row.readAt?.toISOString() ?? null,
    emailReady: row.emailReady,
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
