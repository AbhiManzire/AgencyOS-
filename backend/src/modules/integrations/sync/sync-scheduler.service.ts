import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WebhookEngineService } from '../webhooks/webhook-engine.service';
import { SyncQueueService } from './sync-queue.service';
import { SyncRunnerService } from './sync-runner.service';

const POLL_INTERVAL_MS = 60_000;
const DUE_BATCH_SIZE = 50;

@Injectable()
export class SyncSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncSchedulerService.name);
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private ticking = false;

  constructor(
    private readonly syncQueue: SyncQueueService,
    private readonly syncRunner: SyncRunnerService,
    private readonly webhookEngine: WebhookEngineService,
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
      const dueJobs = await this.syncQueue.findDueJobs(now, DUE_BATCH_SIZE);
      for (const job of dueJobs) {
        await this.syncRunner.processJob(job);
      }

      await this.webhookEngine.processDueRetries(DUE_BATCH_SIZE);
    } catch (error) {
      this.logger.error(
        'Integration sync scheduler tick failed',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ticking = false;
    }
  }
}
