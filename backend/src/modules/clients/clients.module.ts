import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { WorkflowEventsModule } from '../automation/workflow-events.module';
import { ClientContactsController } from './controllers/client-contacts.controller';
import { ClientTagsController } from './controllers/client-tags.controller';
import { ClientsController } from './controllers/clients.controller';
import { ClientContactDomainService } from './domain/client-contact-domain.service';
import { ClientDomainService } from './domain/client-domain.service';
import { CLIENT_CONTACT_REPOSITORY } from './repositories/client-contact.repository.interface';
import { PrismaClientContactRepository } from './repositories/prisma-client-contact.repository';
import { CLIENT_TAG_REPOSITORY } from './repositories/client-tag.repository.interface';
import { PrismaClientTagRepository } from './repositories/prisma-client-tag.repository';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from './repositories/client.repository.interface';
import { PrismaClientRepository } from './repositories/prisma-client.repository';
import { ClientContactService } from './services/client-contact.service';
import { ClientTagService } from './services/client-tag.service';
import { ClientService } from './services/client.service';
import { ClientRenewalsController } from './success/controllers/client-renewals.controller';
import { ClientSuccessController } from './success/controllers/client-success.controller';
import { CLIENT_RENEWAL_REPOSITORY } from './success/repositories/client-renewal.repository.interface';
import { PrismaClientRenewalRepository } from './success/repositories/prisma-client-renewal.repository';
import { ClientConversionService } from './success/services/client-conversion.service';
import { ClientHealthService } from './success/services/client-health.service';
import { ClientMergeService } from './success/services/client-merge.service';
import { ClientMetricsService } from './success/services/client-metrics.service';
import { ClientRenewalService } from './success/services/client-renewal.service';
import { ClientSuccessDashboardService } from './success/services/client-success-dashboard.service';
import { ClientWorkspaceService } from './success/services/client-workspace.service';

@Module({
  imports: [ActivitiesModule, WorkflowEventsModule],
  providers: [
    {
      provide: CLIENT_REPOSITORY,
      useClass: PrismaClientRepository,
    },
    {
      provide: CLIENT_CONTACT_REPOSITORY,
      useClass: PrismaClientContactRepository,
    },
    {
      provide: CLIENT_TAG_REPOSITORY,
      useClass: PrismaClientTagRepository,
    },
    {
      provide: CLIENT_RENEWAL_REPOSITORY,
      useClass: PrismaClientRenewalRepository,
    },
    {
      provide: ClientDomainService,
      useFactory: (clientRepository: ClientRepository) => new ClientDomainService(clientRepository),
      inject: [CLIENT_REPOSITORY],
    },
    ClientContactDomainService,
    ClientService,
    ClientContactService,
    ClientTagService,
    ClientHealthService,
    ClientMetricsService,
    ClientConversionService,
    ClientMergeService,
    ClientRenewalService,
    ClientSuccessDashboardService,
    ClientWorkspaceService,
  ],
  controllers: [
    ClientSuccessController,
    ClientRenewalsController,
    ClientsController,
    ClientContactsController,
    ClientTagsController,
  ],
  exports: [
    CLIENT_REPOSITORY,
    CLIENT_CONTACT_REPOSITORY,
    CLIENT_TAG_REPOSITORY,
    ClientDomainService,
    ClientContactDomainService,
    ClientService,
    ClientContactService,
    ClientTagService,
    ClientConversionService,
    ClientHealthService,
    ClientMetricsService,
  ],
})
export class ClientsModule {}
