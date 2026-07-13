import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NOTIFICATION_EVENT_KEYS } from '../../../../notifications/events/notification-event.catalog';
import { SalesNotificationEmitter } from '../../../../notifications/events/sales-notification.emitter';
import {
  SALES_TASK_REPOSITORY,
  type SalesTaskRecord,
  type SalesTaskRepository,
} from '../repositories/sales-task.repository.interface';

const POLL_INTERVAL_MS = 60_000;
const BATCH_SIZE = 100;
const MEETING_SOON_MS = 60 * 60 * 1000;

@Injectable()
export class SalesTaskSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SalesTaskSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    @Inject(SALES_TASK_REPOSITORY)
    private readonly salesTaskRepository: SalesTaskRepository,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
  ) {}

  onModuleInit(): void {
    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async tick(): Promise<void> {
    if (this.ticking) {
      return;
    }

    this.ticking = true;
    try {
      const now = new Date();
      await this.markOverdueTasks(now);
      await this.notifyMeetingsSoon(now);
    } catch (error) {
      this.logger.error(
        'Sales task scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async markOverdueTasks(now: Date): Promise<void> {
    const overdue = await this.salesTaskRepository.findPendingOverdue(now, BATCH_SIZE);

    for (const task of overdue) {
      await this.markOverdue(task, now);
    }
  }

  private async markOverdue(task: SalesTaskRecord, now: Date): Promise<void> {
    try {
      const marked = await this.salesTaskRepository.markOverdue(task.id, {
        updatedAt: now,
      });

      if (marked === null) {
        return;
      }

      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.TASK_OVERDUE,
        {
          tenantId: marked.tenantId,
          workspaceId: marked.workspaceId,
        },
        marked.ownerUserId,
        {
          title: marked.title,
          subject: marked.title,
          dueSuffix: '',
        },
        {
          entityType: 'sales_task',
          entityId: marked.id,
          linkPath: `/sales/workspace/tasks/${marked.id}`,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark sales task ${task.id} overdue`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyMeetingsSoon(now: Date): Promise<void> {
    const until = new Date(now.getTime() + MEETING_SOON_MS);
    const meetings = await this.salesTaskRepository.findMeetingsDueSoon(now, until, BATCH_SIZE);

    for (const meeting of meetings) {
      await this.emitMeetingSoon(meeting, now);
    }
  }

  private async emitMeetingSoon(task: SalesTaskRecord, now: Date): Promise<void> {
    try {
      if (hasMeetingSoonNotified(task.metadata)) {
        return;
      }

      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.MEETING_SOON,
        {
          tenantId: task.tenantId,
          workspaceId: task.workspaceId,
        },
        task.ownerUserId,
        {
          title: task.title,
          subject: task.title,
          timeSuffix: '',
        },
        {
          entityType: 'sales_task',
          entityId: task.id,
          linkPath: `/sales/workspace/tasks/${task.id}`,
        },
      );

      const nextMetadata = mergeMetadata(task.metadata, {
        meetingSoonNotifiedAt: now.toISOString(),
      });

      await this.salesTaskRepository.update(
        { tenantId: task.tenantId, workspaceId: task.workspaceId },
        task.id,
        {
          metadata: nextMetadata,
          updatedAt: now,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit MEETING_SOON for sales task ${task.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

function hasMeetingSoonNotified(metadata: Prisma.JsonValue | null): boolean {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }
  return typeof (metadata as Record<string, unknown>).meetingSoonNotifiedAt === 'string';
}

function mergeMetadata(
  metadata: Prisma.JsonValue | null,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base =
    metadata !== null && typeof metadata === 'object' && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  return { ...base, ...patch } as Prisma.InputJsonValue;
}
