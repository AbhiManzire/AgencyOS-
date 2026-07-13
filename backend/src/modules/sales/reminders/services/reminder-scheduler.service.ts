import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivityService } from '../../../activities/services/activity.service';
import { WorkflowEventDispatcher } from '../../../automation/services/workflow-event-dispatcher.service';
import { SalesNotificationEmitter } from '../../../notifications/events/sales-notification.emitter';
import { ReminderDomainService } from '../domain/reminder-domain.service';
import {
  REMINDER_REPOSITORY,
  type ReminderRecord,
  type ReminderRepository,
} from '../repositories/reminder.repository.interface';

const POLL_INTERVAL_MS = 60_000;
const DUE_BATCH_SIZE = 100;

@Injectable()
export class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    @Inject(REMINDER_REPOSITORY)
    private readonly reminderRepository: ReminderRepository,
    private readonly reminderDomainService: ReminderDomainService,
    private readonly salesNotificationEmitter: SalesNotificationEmitter,
    private readonly activityService: ActivityService,
    private readonly workflowEventDispatcher: WorkflowEventDispatcher,
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
      const due = await this.reminderRepository.findDue(now, DUE_BATCH_SIZE);

      for (const reminder of due) {
        await this.fireReminder(reminder, now);
      }
    } catch (error) {
      this.logger.error(
        'Reminder scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async fireReminder(reminder: ReminderRecord, now: Date): Promise<void> {
    try {
      await this.salesNotificationEmitter.emitFromReminder({
        scope: {
          tenantId: reminder.tenantId,
          workspaceId: reminder.workspaceId,
        },
        recipientUserId: reminder.assignedUserId,
        notificationEventKey: reminder.notificationEventKey,
        title: reminder.title,
        body: reminder.body,
        entityType: reminder.entityType,
        entityId: reminder.entityId,
      });

      if (
        reminder.entityType !== null &&
        reminder.entityType.trim().length > 0 &&
        reminder.entityId !== null
      ) {
        await this.activityService.logSystemEvent(
          {
            tenantId: reminder.tenantId,
            workspaceId: reminder.workspaceId,
          },
          {
            entityType: reminder.entityType,
            entityId: reminder.entityId,
            type: ActivityType.REMINDER,
            title: reminder.title,
            description: reminder.body ?? undefined,
            dedupeKey: `reminder.fired:${reminder.id}:${now.toISOString()}`,
            metadata: {
              reminderId: reminder.id,
              notificationEventKey: reminder.notificationEventKey,
            },
          },
          { actorUserId: reminder.assignedUserId },
        );
      }

      if (reminder.recurrence === 'NONE') {
        await this.reminderRepository.markFired(reminder.id, {
          status: 'SENT',
          lastFiredAt: now,
          updatedAt: now,
        });
        this.emitReminderDue(reminder);
        return;
      }

      const advanced = this.reminderDomainService.advanceRecurrence(
        reminder.remindAt,
        reminder.remindDate,
        reminder.recurrence,
      );

      await this.reminderRepository.markFired(reminder.id, {
        status: 'PENDING',
        lastFiredAt: now,
        remindAt: advanced.remindAt,
        remindDate: advanced.remindDate,
        updatedAt: now,
      });
      this.emitReminderDue(reminder);
    } catch (error) {
      this.logger.error(
        `Failed to fire reminder ${reminder.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private emitReminderDue(reminder: ReminderRecord): void {
    void this.workflowEventDispatcher
      .dispatch({
        scope: {
          tenantId: reminder.tenantId,
          workspaceId: reminder.workspaceId,
        },
        triggerType: 'REMINDER_DUE',
        entityType: reminder.entityType ?? 'reminder',
        entityId: reminder.entityId ?? reminder.id,
        actorUserId: reminder.assignedUserId,
        payload: {
          entityType: reminder.entityType ?? 'reminder',
          entityId: reminder.entityId ?? reminder.id,
          id: reminder.id,
          reminderId: reminder.id,
          title: reminder.title,
          assignedUserId: reminder.assignedUserId,
        },
      })
      .catch((error: unknown) => {
        this.logger.error(
          `Workflow emit REMINDER_DUE failed for reminder ${reminder.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}
