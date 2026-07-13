import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SalesNotificationEmitter } from '../../../notifications/events/sales-notification.emitter';
import { NOTIFICATION_EVENT_KEYS } from '../../../notifications/events/notification-event.catalog';
import { ActivityService } from '../../../activities/services/activity.service';
import {
  DEAL_REPOSITORY,
  type DealCloseDateCandidate,
  type DealRepository,
} from '../repositories/deal.repository.interface';

const POLL_INTERVAL_MS = 60_000;

@Injectable()
export class DealAutomationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DealAutomationSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    @Inject(DEAL_REPOSITORY)
    private readonly dealRepository: DealRepository,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
    private readonly activityService: ActivityService,
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
      const todayUtc = startOfUtcDay(now);
      const inThreeDays = addUtcDays(todayUtc, 3);

      const approaching = await this.dealRepository.findOpenDealsWithCloseDateBetween(
        todayUtc,
        inThreeDays,
      );
      for (const deal of approaching) {
        await this.emitCloseApproaching(deal, todayUtc);
      }

      const overdue = await this.dealRepository.findOverdueOpenDeals(todayUtc);
      for (const deal of overdue) {
        await this.emitOverdue(deal, todayUtc);
      }
    } catch (error) {
      this.logger.error(
        'Deal automation scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async emitCloseApproaching(deal: DealCloseDateCandidate, todayUtc: Date): Promise<void> {
    if (deal.ownerUserId === null) {
      return;
    }

    const dateKey = formatUtcDate(todayUtc);
    const dedupeKey = `deal.close_approaching:${deal.id}:${dateKey}`;
    const tickStartedAt = Date.now();

    const activity = await this.activityService.logSystemEvent(
      { tenantId: deal.tenantId, workspaceId: deal.workspaceId },
      {
        entityType: 'deal',
        entityId: deal.id,
        type: 'CUSTOM',
        title: 'Close date approaching',
        description: `Expected close date for "${deal.title}" is approaching.`,
        dedupeKey,
        metadata: {
          expectedCloseDate: deal.expectedCloseDate.toISOString(),
          notificationEventKey: NOTIFICATION_EVENT_KEYS.DEAL_CLOSE_APPROACHING,
        },
      },
      { actorUserId: deal.ownerUserId },
    );

    // Dedupe hit — already notified today.
    if (activity.createdAt.getTime() < tickStartedAt - 2_000) {
      return;
    }

    try {
      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.DEAL_CLOSE_APPROACHING,
        { tenantId: deal.tenantId, workspaceId: deal.workspaceId },
        deal.ownerUserId,
        { title: deal.title },
        {
          entityType: 'Deal',
          entityId: deal.id,
          linkPath: `/sales/deals/${deal.id}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit DEAL_CLOSE_APPROACHING for deal ${deal.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async emitOverdue(deal: DealCloseDateCandidate, todayUtc: Date): Promise<void> {
    if (deal.ownerUserId === null) {
      return;
    }

    const dateKey = formatUtcDate(todayUtc);
    const dedupeKey = `deal.overdue:${deal.id}:${dateKey}`;
    const tickStartedAt = Date.now();

    const activity = await this.activityService.logSystemEvent(
      { tenantId: deal.tenantId, workspaceId: deal.workspaceId },
      {
        entityType: 'deal',
        entityId: deal.id,
        type: 'CUSTOM',
        title: 'Deal overdue',
        description: `Expected close date for "${deal.title}" has passed.`,
        dedupeKey,
        metadata: {
          expectedCloseDate: deal.expectedCloseDate.toISOString(),
          notificationEventKey: NOTIFICATION_EVENT_KEYS.DEAL_OVERDUE,
        },
      },
      { actorUserId: deal.ownerUserId },
    );

    if (activity.createdAt.getTime() < tickStartedAt - 2_000) {
      return;
    }

    try {
      await this.salesNotificationEmitter.emit(
        NOTIFICATION_EVENT_KEYS.DEAL_OVERDUE,
        { tenantId: deal.tenantId, workspaceId: deal.workspaceId },
        deal.ownerUserId,
        { title: deal.title },
        {
          entityType: 'Deal',
          entityId: deal.id,
          linkPath: `/sales/deals/${deal.id}`,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Failed to emit DEAL_OVERDUE for deal ${deal.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
