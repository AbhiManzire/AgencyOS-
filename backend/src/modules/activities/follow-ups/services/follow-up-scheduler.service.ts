import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NOTIFICATION_EVENT_KEYS } from '../../../notifications/events/notification-event.catalog';
import { SalesNotificationEmitter } from '../../../notifications/events/sales-notification.emitter';
import {
  FOLLOW_UP_REPOSITORY,
  type FollowUpRecord,
  type FollowUpRepository,
} from '../repositories/follow-up.repository.interface';

const POLL_INTERVAL_MS = 60_000;
const OVERDUE_BATCH_SIZE = 100;

@Injectable()
export class FollowUpSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FollowUpSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    @Inject(FOLLOW_UP_REPOSITORY)
    private readonly followUpRepository: FollowUpRepository,
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
      const overdue = await this.followUpRepository.findPendingOverdue(now, OVERDUE_BATCH_SIZE);

      for (const followUp of overdue) {
        await this.markMissed(followUp, now);
      }
    } catch (error) {
      this.logger.error(
        'Follow-up scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async markMissed(followUp: FollowUpRecord, now: Date): Promise<void> {
    try {
      // updateMany with status PENDING ensures PENDING→MISSED only once (no duplicate notifications).
      const marked = await this.followUpRepository.markMissed(followUp.id, {
        missedAt: now,
        updatedAt: now,
      });

      if (marked === null) {
        return;
      }

      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.FOLLOW_UP_OVERDUE,
        {
          tenantId: marked.tenantId,
          workspaceId: marked.workspaceId,
        },
        marked.assignedUserId,
        {
          subject: marked.title,
          dueSuffix: '',
        },
        {
          entityType: marked.entityType,
          entityId: marked.entityId,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to mark follow-up ${followUp.id} as missed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
