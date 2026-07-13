import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { WorkflowScheduleFrequency } from '@prisma/client';
import { AutomationEngineService } from './automation-engine.service';
import { WorkflowRunnerService } from './workflow-runner.service';

const POLL_INTERVAL_MS = 30_000;

@Injectable()
export class AutomationSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    private readonly automationEngine: AutomationEngineService,
    private readonly workflowRunner: WorkflowRunnerService,
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
      await this.processDueExecutions(now);
      await this.processDueSchedules(now);
    } catch (error) {
      this.logger.error(
        'Automation scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }

  private async processDueExecutions(now: Date): Promise<void> {
    const due = await this.automationEngine.listDueExecutions(now, 50);

    for (const execution of due) {
      try {
        await this.workflowRunner.runExecution(
          { tenantId: execution.tenantId, workspaceId: execution.workspaceId },
          execution.id,
        );
      } catch (error) {
        this.logger.error(
          `Failed processing due execution ${execution.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }

  private async processDueSchedules(now: Date): Promise<void> {
    const schedules = await this.automationEngine.listDueSchedules(now);

    for (const schedule of schedules) {
      try {
        const scope = {
          tenantId: schedule.tenantId,
          workspaceId: schedule.workspaceId,
        };

        const execution = await this.automationEngine.enqueueExecution(scope, {
          workflowId: schedule.workflowId,
          triggerType: 'CUSTOM_EVENT',
          triggerPayload: {
            scheduleId: schedule.id,
            workflowId: schedule.workflowId,
            frequency: schedule.frequency,
            eventKey: 'SCHEDULE',
            triggeredAt: now.toISOString(),
          },
        });

        if (execution.scheduledFor === null || execution.scheduledFor.getTime() <= now.getTime()) {
          void this.workflowRunner.runExecution(scope, execution.id).catch((error: unknown) => {
            this.logger.error(
              `Scheduled execution ${execution.id} failed`,
              error instanceof Error ? error.stack : String(error),
            );
          });
        }

        const nextRunAt = computeNextRunAt(schedule.frequency, now);
        await this.automationEngine.markScheduleRun(schedule.id, now, nextRunAt);
      } catch (error) {
        this.logger.error(
          `Failed processing schedule ${schedule.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }
  }
}

function computeNextRunAt(frequency: WorkflowScheduleFrequency, from: Date): Date | null {
  switch (frequency) {
    case 'ONCE':
      return null;
    case 'HOURLY':
      return new Date(from.getTime() + 3_600_000);
    case 'DAILY':
      return new Date(from.getTime() + 86_400_000);
    case 'WEEKLY':
      return new Date(from.getTime() + 7 * 86_400_000);
    case 'MONTHLY': {
      const next = new Date(from);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    }
    case 'CRON':
      return new Date(from.getTime() + 86_400_000);
    default:
      return new Date(from.getTime() + 86_400_000);
  }
}
