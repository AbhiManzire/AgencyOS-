import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { CreateNotificationDto } from '../dto/create-notification.dto';
import type { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import type {
  ListNotificationsResult,
  NotificationRecord,
  NotificationScope,
} from '../notification.types';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../repositories/notification.repository.interface';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async list(
    scope: NotificationScope,
    recipientUserId: string,
    query: ListNotificationsQueryDto,
  ): Promise<ListNotificationsResult> {
    return this.notificationRepository.list({
      scope,
      recipientUserId,
      category: query.category,
      isRead: query.isRead,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  async unreadCount(scope: NotificationScope, recipientUserId: string): Promise<number> {
    return this.notificationRepository.unreadCount(scope, recipientUserId);
  }

  async markRead(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
  ): Promise<NotificationRecord> {
    const updated = await this.notificationRepository.markRead(
      scope,
      id,
      recipientUserId,
      new Date(),
    );
    if (updated === null) {
      throw new NotFoundException('Notification not found.');
    }
    return updated;
  }

  async markAllRead(
    scope: NotificationScope,
    recipientUserId: string,
  ): Promise<{ updated: number }> {
    const updated = await this.notificationRepository.markAllRead(
      scope,
      recipientUserId,
      new Date(),
    );
    return { updated };
  }

  async archive(
    scope: NotificationScope,
    id: string,
    recipientUserId: string,
  ): Promise<NotificationRecord> {
    const archived = await this.notificationRepository.archive(
      scope,
      id,
      recipientUserId,
      new Date(),
    );
    if (archived === null) {
      throw new NotFoundException('Notification not found.');
    }
    return archived;
  }

  async create(scope: NotificationScope, dto: CreateNotificationDto): Promise<NotificationRecord> {
    return this.notificationRepository.create(scope, {
      recipientUserId: dto.recipientUserId,
      category: dto.category,
      priority: dto.priority,
      title: dto.title.trim(),
      body: dto.body.trim(),
      entityType: dto.entityType,
      entityId: dto.entityId,
      linkPath: dto.linkPath,
      emailReady: dto.emailReady,
      metadata: dto.metadata !== undefined ? (dto.metadata as Prisma.InputJsonValue) : undefined,
    });
  }
}
