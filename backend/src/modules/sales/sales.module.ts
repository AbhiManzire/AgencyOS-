import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { ClientsModule } from '../clients/clients.module';
import {
  CLIENT_CONTACT_REPOSITORY,
  type ClientContactRepository,
} from '../clients/repositories/client-contact.repository.interface';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository.interface';
import { ProjectsModule } from '../projects/projects.module';
import { DealsController } from './deals/controllers/deals.controller';
import { DealDomainService } from './deals/domain/deal-domain.service';
import {
  DEAL_REPOSITORY,
  type DealRepository,
} from './deals/repositories/deal.repository.interface';
import { PrismaDealRepository } from './deals/repositories/prisma-deal.repository';
import { DealService } from './deals/services/deal.service';
import { DealFollowUpsController } from './followups/controllers/deal-followups.controller';
import { FollowUpsController } from './followups/controllers/followups.controller';
import { FollowUpDomainService } from './followups/domain/followup-domain.service';
import { FOLLOWUP_REPOSITORY } from './followups/repositories/followup.repository.interface';
import { PrismaFollowUpRepository } from './followups/repositories/prisma-followup.repository';
import { FollowUpService } from './followups/services/followup.service';
import { LeadTagsController } from './leads/controllers/lead-tags.controller';
import { LeadsController } from './leads/controllers/leads.controller';
import { LeadDomainService } from './leads/domain/lead-domain.service';
import { LEAD_TAG_REPOSITORY } from './leads/repositories/lead-tag.repository.interface';
import { PrismaLeadTagRepository } from './leads/repositories/prisma-lead-tag.repository';
import { LEAD_REPOSITORY } from './leads/repositories/lead.repository.interface';
import { PrismaLeadRepository } from './leads/repositories/prisma-lead.repository';
import { LeadTagService } from './leads/services/lead-tag.service';
import { LeadService } from './leads/services/lead.service';
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

@Module({
  imports: [ClientsModule, ActivitiesModule, ProjectsModule],
  providers: [
    {
      provide: DEAL_REPOSITORY,
      useClass: PrismaDealRepository,
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
    LeadDomainService,
    DealService,
    FollowUpService,
    QuoteService,
    QuoteLineItemService,
    ProposalService,
    LeadService,
    LeadTagService,
  ],
  controllers: [
    DealsController,
    DealFollowUpsController,
    FollowUpsController,
    QuotesController,
    QuoteLineItemsController,
    QuoteItemsController,
    ProposalsController,
    LeadsController,
    LeadTagsController,
  ],
  exports: [
    DEAL_REPOSITORY,
    FOLLOWUP_REPOSITORY,
    QUOTE_REPOSITORY,
    QUOTE_LINE_ITEM_REPOSITORY,
    PROPOSAL_REPOSITORY,
    PROPOSAL_VERSION_REPOSITORY,
    LEAD_REPOSITORY,
    LEAD_TAG_REPOSITORY,
    DealDomainService,
    FollowUpDomainService,
    QuoteDomainService,
    QuoteLineItemDomainService,
    ProposalDomainService,
    LeadDomainService,
    DealService,
    FollowUpService,
    QuoteService,
    QuoteLineItemService,
    ProposalService,
    LeadService,
    LeadTagService,
  ],
})
export class SalesModule {}
