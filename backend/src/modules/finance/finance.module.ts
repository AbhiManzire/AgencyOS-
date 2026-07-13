import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { WorkflowEventsModule } from '../automation/workflow-events.module';
import { ClientsModule } from '../clients/clients.module';
import {
  CLIENT_REPOSITORY,
  type ClientRepository,
} from '../clients/repositories/client.repository.interface';
import { FilesModule } from '../files/files.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
} from '../projects/repositories/project.repository.interface';
import { SalesModule } from '../sales/sales.module';
import {
  QUOTE_REPOSITORY,
  type QuoteRepository,
} from '../sales/quotes/repositories/quote.repository.interface';
import {
  FINANCE_SPRINT5_CONTROLLERS,
  FINANCE_SPRINT5_EXPORTS,
  FINANCE_SPRINT5_PROVIDERS,
} from './finance-sprint5.providers';
import { InvoiceItemsController } from './invoice-line-items/controllers/invoice-items.controller';
import { InvoiceLineItemsController } from './invoice-line-items/controllers/invoice-line-items.controller';
import { InvoiceLineItemDomainService } from './invoice-line-items/domain/invoice-line-item-domain.service';
import { INVOICE_LINE_ITEM_REPOSITORY } from './invoice-line-items/repositories/invoice-line-item.repository.interface';
import { PrismaInvoiceLineItemRepository } from './invoice-line-items/repositories/prisma-invoice-line-item.repository';
import { InvoiceLineItemService } from './invoice-line-items/services/invoice-line-item.service';
import { InvoiceDeliveryController } from './invoices/controllers/invoice-delivery.controller';
import { InvoicesController } from './invoices/controllers/invoices.controller';
import { InvoiceDeliveryService } from './invoices/delivery/invoice-delivery.service';
import { InvoiceDomainService } from './invoices/domain/invoice-domain.service';
import { InvoicePdfGenerator } from './invoices/pdf/invoice-pdf.generator';
import { INVOICE_REPOSITORY } from './invoices/repositories/invoice.repository.interface';
import { PrismaInvoiceRepository } from './invoices/repositories/prisma-invoice.repository';
import { InvoiceService } from './invoices/services/invoice.service';
import {
  InvoicePaymentsController,
  PaymentsController,
} from './payments/controllers/payments.controller';
import { PaymentDomainService } from './payments/domain/payment-domain.service';
import { PAYMENT_REPOSITORY } from './payments/repositories/payment.repository.interface';
import { PrismaPaymentRepository } from './payments/repositories/prisma-payment.repository';
import { PaymentService } from './payments/services/payment.service';

@Module({
  imports: [
    ClientsModule,
    ProjectsModule,
    SalesModule,
    ActivitiesModule,
    FilesModule,
    NotificationsModule,
    WorkflowEventsModule,
  ],
  providers: [
    {
      provide: INVOICE_REPOSITORY,
      useClass: PrismaInvoiceRepository,
    },
    {
      provide: INVOICE_LINE_ITEM_REPOSITORY,
      useClass: PrismaInvoiceLineItemRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: InvoiceDomainService,
      useFactory: (
        clientRepository: ClientRepository,
        projectRepository: ProjectRepository,
        quoteRepository: QuoteRepository,
      ) => new InvoiceDomainService(clientRepository, projectRepository, quoteRepository),
      inject: [CLIENT_REPOSITORY, PROJECT_REPOSITORY, QUOTE_REPOSITORY],
    },
    InvoiceLineItemDomainService,
    PaymentDomainService,
    InvoicePdfGenerator,
    InvoiceService,
    InvoiceLineItemService,
    InvoiceDeliveryService,
    PaymentService,
    ...FINANCE_SPRINT5_PROVIDERS,
  ],
  controllers: [
    InvoiceDeliveryController,
    InvoicesController,
    InvoiceLineItemsController,
    InvoiceItemsController,
    PaymentsController,
    InvoicePaymentsController,
    ...FINANCE_SPRINT5_CONTROLLERS,
  ],
  exports: [
    INVOICE_REPOSITORY,
    INVOICE_LINE_ITEM_REPOSITORY,
    PAYMENT_REPOSITORY,
    InvoiceDomainService,
    InvoiceLineItemDomainService,
    PaymentDomainService,
    InvoiceService,
    InvoiceLineItemService,
    InvoiceDeliveryService,
    PaymentService,
    ...FINANCE_SPRINT5_EXPORTS,
  ],
})
export class FinanceModule {}
