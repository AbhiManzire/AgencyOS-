import { Module } from '@nestjs/common';
import { AdaptersRegistry } from './adapters/adapters.registry';
import { IntegrationsController } from './controllers/integrations.controller';
import { IntegrationSyncController } from './controllers/integration-sync.controller';
import { IntegrationWebhooksController } from './controllers/integration-webhooks.controller';
import { CredentialCryptoService } from './credentials/credential-crypto.service';
import { CredentialStoreService } from './credentials/credential-store.service';
import { IntegrationDomainService } from './domain/integration-domain.service';
import { IntegrationHealthService } from './services/integration-health.service';
import { IntegrationService } from './services/integration.service';
import { SyncQueueService } from './sync/sync-queue.service';
import { SyncRunnerService } from './sync/sync-runner.service';
import { SyncSchedulerService } from './sync/sync-scheduler.service';
import { WebhookEngineService } from './webhooks/webhook-engine.service';

@Module({
  controllers: [IntegrationsController, IntegrationSyncController, IntegrationWebhooksController],
  providers: [
    IntegrationDomainService,
    AdaptersRegistry,
    CredentialCryptoService,
    CredentialStoreService,
    WebhookEngineService,
    SyncQueueService,
    SyncRunnerService,
    SyncSchedulerService,
    IntegrationHealthService,
    IntegrationService,
  ],
  exports: [IntegrationService],
})
export class IntegrationsModule {}
