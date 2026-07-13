import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { WorkflowEventsModule } from '../automation/workflow-events.module';
import { ClientsModule } from '../clients/clients.module';
import {
  CLIENT_CONTACT_REPOSITORY,
  type ClientContactRepository,
} from '../clients/repositories/client-contact.repository.interface';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository.interface';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { CampaignsController } from './campaigns/controllers/campaigns.controller';
import { CampaignDomainService } from './campaigns/domain/campaign-domain.service';
import { CAMPAIGN_REPOSITORY } from './campaigns/repositories/campaign.repository.interface';
import { PrismaCampaignRepository } from './campaigns/repositories/prisma-campaign.repository';
import { CampaignService } from './campaigns/services/campaign.service';
import { DealLineItemItemsController } from './deal-line-items/controllers/deal-line-item-items.controller';
import { DealLineItemsController } from './deal-line-items/controllers/deal-line-items.controller';
import { DealLineItemDomainService } from './deal-line-items/domain/deal-line-item-domain.service';
import { DEAL_LINE_ITEM_REPOSITORY } from './deal-line-items/repositories/deal-line-item.repository.interface';
import { PrismaDealLineItemRepository } from './deal-line-items/repositories/prisma-deal-line-item.repository';
import { DealLineItemService } from './deal-line-items/services/deal-line-item.service';
import { DealsController } from './deals/controllers/deals.controller';
import { DealDomainService } from './deals/domain/deal-domain.service';
import {
  DEAL_REPOSITORY,
  type DealRepository,
} from './deals/repositories/deal.repository.interface';
import { PrismaDealRepository } from './deals/repositories/prisma-deal.repository';
import { DealAutomationSchedulerService } from './deals/services/deal-automation-scheduler.service';
import { DealService } from './deals/services/deal.service';
import { DealTagsController } from './deals/tags/controllers/deal-tags.controller';
import { DEAL_TAG_REPOSITORY } from './deals/tags/repositories/deal-tag.repository.interface';
import { PrismaDealTagRepository } from './deals/tags/repositories/prisma-deal-tag.repository';
import { DealTagService } from './deals/tags/services/deal-tag.service';
import { DealFollowUpsController } from './followups/controllers/deal-followups.controller';
import { FollowUpsController } from './followups/controllers/followups.controller';
import { FollowUpDomainService } from './followups/domain/followup-domain.service';
import { FOLLOWUP_REPOSITORY } from './followups/repositories/followup.repository.interface';
import { PrismaFollowUpRepository } from './followups/repositories/prisma-followup.repository';
import { FollowUpService } from './followups/services/followup.service';
import { LeadIntakeController } from './lead-intake/controllers/lead-intake.controller';
import { LeadIntakeRegistry } from './lead-intake/lead-intake.registry';
import { LEAD_INTAKE_PROVIDERS } from './lead-intake/lead-intake.types';
import { GoogleLeadFormsProvider } from './lead-intake/providers/google-lead-forms.provider';
import { MetaLeadAdsProvider } from './lead-intake/providers/meta-lead-ads.provider';
import { PublicApiIntakeProvider } from './lead-intake/providers/public-api.provider';
import { WebhooksIntakeProvider } from './lead-intake/providers/webhooks.provider';
import { WebsiteFormsProvider } from './lead-intake/providers/website-forms.provider';
import { WhatsAppIntakeProvider } from './lead-intake/providers/whatsapp.provider';
import { LeadIntakeService } from './lead-intake/services/lead-intake.service';
import { LeadBulkController } from './leads/bulk/controllers/lead-bulk.controller';
import { LeadBulkService } from './leads/bulk/services/lead-bulk.service';
import { LeadTagsController } from './leads/controllers/lead-tags.controller';
import { LeadsController } from './leads/controllers/leads.controller';
import { LeadDomainService } from './leads/domain/lead-domain.service';
import { LeadImportExportController } from './leads/import-export/controllers/lead-import-export.controller';
import { LeadImportExportService } from './leads/import-export/services/lead-import-export.service';
import { LEAD_TAG_REPOSITORY } from './leads/repositories/lead-tag.repository.interface';
import { PrismaLeadTagRepository } from './leads/repositories/prisma-lead-tag.repository';
import { LEAD_REPOSITORY } from './leads/repositories/lead.repository.interface';
import { PrismaLeadRepository } from './leads/repositories/prisma-lead.repository';
import { LeadTagService } from './leads/services/lead-tag.service';
import { LeadService } from './leads/services/lead.service';
import { PipelinesController } from './pipelines/controllers/pipelines.controller';
import { PIPELINE_REPOSITORY } from './pipelines/repositories/pipeline.repository.interface';
import { PrismaPipelineRepository } from './pipelines/repositories/prisma-pipeline.repository';
import { SalesPipelineService } from './pipelines/services/sales-pipeline.service';
import { QuoteItemsController } from './quote-line-items/controllers/quote-items.controller';
import { QuoteLineItemsController } from './quote-line-items/controllers/quote-line-items.controller';
import { QuoteLineItemDomainService } from './quote-line-items/domain/quote-line-item-domain.service';
import { QUOTE_LINE_ITEM_REPOSITORY } from './quote-line-items/repositories/quote-line-item.repository.interface';
import { PrismaQuoteLineItemRepository } from './quote-line-items/repositories/prisma-quote-line-item.repository';
import { QuoteLineItemService } from './quote-line-items/services/quote-line-item.service';
import { ProposalsController } from './proposals/controllers/proposals.controller';
import { ProposalDomainService } from './proposals/domain/proposal-domain.service';
import {
  PROPOSAL_REPOSITORY,
  PROPOSAL_VERSION_REPOSITORY,
} from './proposals/repositories/proposal.repository.interface';
import {
  PrismaProposalRepository,
  PrismaProposalVersionRepository,
} from './proposals/repositories/prisma-proposal.repository';
import { ProposalService } from './proposals/services/proposal.service';
import { QuotesController } from './quotes/controllers/quotes.controller';
import { QuoteDomainService } from './quotes/domain/quote-domain.service';
import {
  QUOTE_REPOSITORY,
  type QuoteRepository,
} from './quotes/repositories/quote.repository.interface';
import { PrismaQuoteRepository } from './quotes/repositories/prisma-quote.repository';
import { QuoteService } from './quotes/services/quote.service';
import { RemindersController } from './reminders/controllers/reminders.controller';
import { ReminderDomainService } from './reminders/domain/reminder-domain.service';
import { REMINDER_REPOSITORY } from './reminders/repositories/reminder.repository.interface';
import { PrismaReminderRepository } from './reminders/repositories/prisma-reminder.repository';
import { ReminderSchedulerService } from './reminders/services/reminder-scheduler.service';
import { ReminderService } from './reminders/services/reminder.service';
import { SalesWorkspaceController } from './workspace/controllers/sales-workspace.controller';
import { WorkspaceCalendarService } from './workspace/services/workspace-calendar.service';
import { WorkspaceDashboardService } from './workspace/services/workspace-dashboard.service';
import { WorkspaceQuickActionsService } from './workspace/services/workspace-quick-actions.service';
import { WorkspaceQueueService } from './workspace/services/workspace-queue.service';
import { SalesTasksController } from './workspace/tasks/controllers/sales-tasks.controller';
import { SalesTaskDomainService } from './workspace/tasks/domain/sales-task-domain.service';
import { SALES_TASK_REPOSITORY } from './workspace/tasks/repositories/sales-task.repository.interface';
import { PrismaSalesTaskRepository } from './workspace/tasks/repositories/prisma-sales-task.repository';
import { SalesTaskSchedulerService } from './workspace/tasks/services/sales-task-scheduler.service';
import { SalesTaskService } from './workspace/tasks/services/sales-task.service';

@Module({
  imports: [
    ClientsModule,
    ActivitiesModule,
    ProjectsModule,
    NotificationsModule,
    WorkflowEventsModule,
  ],
  providers: [
    {
      provide: DEAL_REPOSITORY,
      useClass: PrismaDealRepository,
    },
    {
      provide: PIPELINE_REPOSITORY,
      useClass: PrismaPipelineRepository,
    },
    {
      provide: DEAL_LINE_ITEM_REPOSITORY,
      useClass: PrismaDealLineItemRepository,
    },
    {
      provide: DEAL_TAG_REPOSITORY,
      useClass: PrismaDealTagRepository,
    },
    {
      provide: FOLLOWUP_REPOSITORY,
      useClass: PrismaFollowUpRepository,
    },
    {
      provide: QUOTE_REPOSITORY,
      useClass: PrismaQuoteRepository,
    },
    {
      provide: QUOTE_LINE_ITEM_REPOSITORY,
      useClass: PrismaQuoteLineItemRepository,
    },
    {
      provide: PROPOSAL_REPOSITORY,
      useClass: PrismaProposalRepository,
    },
    {
      provide: PROPOSAL_VERSION_REPOSITORY,
      useClass: PrismaProposalVersionRepository,
    },
    {
      provide: LEAD_REPOSITORY,
      useClass: PrismaLeadRepository,
    },
    {
      provide: LEAD_TAG_REPOSITORY,
      useClass: PrismaLeadTagRepository,
    },
    {
      provide: CAMPAIGN_REPOSITORY,
      useClass: PrismaCampaignRepository,
    },
    {
      provide: REMINDER_REPOSITORY,
      useClass: PrismaReminderRepository,
    },
    {
      provide: SALES_TASK_REPOSITORY,
      useClass: PrismaSalesTaskRepository,
    },
    MetaLeadAdsProvider,
    GoogleLeadFormsProvider,
    WebsiteFormsProvider,
    WhatsAppIntakeProvider,
    PublicApiIntakeProvider,
    WebhooksIntakeProvider,
    {
      provide: LEAD_INTAKE_PROVIDERS,
      useFactory: (
        meta: MetaLeadAdsProvider,
        google: GoogleLeadFormsProvider,
        website: WebsiteFormsProvider,
        whatsapp: WhatsAppIntakeProvider,
        publicApi: PublicApiIntakeProvider,
        webhooks: WebhooksIntakeProvider,
      ) => [meta, google, website, whatsapp, publicApi, webhooks],
      inject: [
        MetaLeadAdsProvider,
        GoogleLeadFormsProvider,
        WebsiteFormsProvider,
        WhatsAppIntakeProvider,
        PublicApiIntakeProvider,
        WebhooksIntakeProvider,
      ],
    },
    {
      provide: DealDomainService,
      useFactory: (
        clientRepository: ClientRepository,
        clientContactRepository: ClientContactRepository,
      ) => new DealDomainService(clientRepository, clientContactRepository),
      inject: [CLIENT_REPOSITORY, CLIENT_CONTACT_REPOSITORY],
    },
    {
      provide: QuoteDomainService,
      useFactory: (clientRepository: ClientRepository, dealRepository: DealRepository) =>
        new QuoteDomainService(clientRepository, dealRepository),
      inject: [CLIENT_REPOSITORY, DEAL_REPOSITORY],
    },
    {
      provide: ProposalDomainService,
      useFactory: (dealRepository: DealRepository, quoteRepository: QuoteRepository) =>
        new ProposalDomainService(dealRepository, quoteRepository),
      inject: [DEAL_REPOSITORY, QUOTE_REPOSITORY],
    },
    FollowUpDomainService,
    QuoteLineItemDomainService,
    DealLineItemDomainService,
    LeadDomainService,
    CampaignDomainService,
    ReminderDomainService,
    SalesTaskDomainService,
    SalesPipelineService,
    DealService,
    DealLineItemService,
    DealTagService,
    DealAutomationSchedulerService,
    FollowUpService,
    QuoteService,
    QuoteLineItemService,
    ProposalService,
    LeadService,
    LeadTagService,
    LeadImportExportService,
    LeadBulkService,
    CampaignService,
    ReminderService,
    ReminderSchedulerService,
    SalesTaskService,
    SalesTaskSchedulerService,
    WorkspaceDashboardService,
    WorkspaceQueueService,
    WorkspaceCalendarService,
    WorkspaceQuickActionsService,
    LeadIntakeRegistry,
    LeadIntakeService,
  ],
  controllers: [
    PipelinesController,
    DealsController,
    DealLineItemsController,
    DealLineItemItemsController,
    DealTagsController,
    DealFollowUpsController,
    FollowUpsController,
    QuotesController,
    QuoteLineItemsController,
    QuoteItemsController,
    ProposalsController,
    LeadIntakeController,
    LeadImportExportController,
    LeadBulkController,
    LeadsController,
    LeadTagsController,
    CampaignsController,
    RemindersController,
    SalesTasksController,
    SalesWorkspaceController,
  ],
  exports: [
    DEAL_REPOSITORY,
    PIPELINE_REPOSITORY,
    DEAL_LINE_ITEM_REPOSITORY,
    DEAL_TAG_REPOSITORY,
    FOLLOWUP_REPOSITORY,
    QUOTE_REPOSITORY,
    QUOTE_LINE_ITEM_REPOSITORY,
    PROPOSAL_REPOSITORY,
    PROPOSAL_VERSION_REPOSITORY,
    LEAD_REPOSITORY,
    LEAD_TAG_REPOSITORY,
    CAMPAIGN_REPOSITORY,
    REMINDER_REPOSITORY,
    SALES_TASK_REPOSITORY,
    DealDomainService,
    FollowUpDomainService,
    QuoteDomainService,
    QuoteLineItemDomainService,
    DealLineItemDomainService,
    ProposalDomainService,
    LeadDomainService,
    CampaignDomainService,
    ReminderDomainService,
    SalesTaskDomainService,
    SalesPipelineService,
    DealService,
    DealLineItemService,
    DealTagService,
    DealAutomationSchedulerService,
    FollowUpService,
    QuoteService,
    QuoteLineItemService,
    ProposalService,
    LeadService,
    LeadTagService,
    LeadImportExportService,
    LeadBulkService,
    CampaignService,
    ReminderService,
    ReminderSchedulerService,
    SalesTaskService,
    SalesTaskSchedulerService,
    WorkspaceDashboardService,
    WorkspaceQueueService,
    WorkspaceCalendarService,
    WorkspaceQuickActionsService,
    LeadIntakeService,
    LeadIntakeRegistry,
  ],
})
export class SalesModule {}
