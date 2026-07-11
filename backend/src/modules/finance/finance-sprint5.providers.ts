import type { Provider, Type } from '@nestjs/common';
import { CreditNotesController } from './credit-notes/controllers/credit-notes.controller';
import { CreditNoteDomainService } from './credit-notes/domain/credit-note-domain.service';
import {
  CREDIT_NOTE_APPLICATION_REPOSITORY,
  CREDIT_NOTE_REPOSITORY,
} from './credit-notes/repositories/credit-note.repository.interface';
import {
  PrismaCreditNoteApplicationRepository,
  PrismaCreditNoteRepository,
} from './credit-notes/repositories/prisma-credit-note.repository';
import { CreditNoteService } from './credit-notes/services/credit-note.service';
import { ExpensesController } from './expenses/controllers/expenses.controller';
import { ExpenseDomainService } from './expenses/domain/expense-domain.service';
import { EXPENSE_REPOSITORY } from './expenses/repositories/expense.repository.interface';
import { PrismaExpenseRepository } from './expenses/repositories/prisma-expense.repository';
import { ExpenseService } from './expenses/services/expense.service';
import { LedgerController } from './ledger/controllers/ledger.controller';
import { LEDGER_ENTRY_REPOSITORY } from './ledger/repositories/ledger-entry.repository.interface';
import { PrismaLedgerEntryRepository } from './ledger/repositories/prisma-ledger-entry.repository';
import { LedgerPostingService } from './ledger/services/ledger-posting.service';
import { LedgerService } from './ledger/services/ledger.service';
import { PurchaseBillItemsController } from './purchases/controllers/purchase-bill-items.controller';
import { PurchaseBillsController } from './purchases/controllers/purchase-bills.controller';
import {
  PurchaseBillPaymentsController,
  PurchasePaymentsController,
} from './purchases/controllers/purchase-payments.controller';
import { PurchaseBillDomainService } from './purchases/domain/purchase-bill-domain.service';
import { PURCHASE_BILL_LINE_ITEM_REPOSITORY } from './purchases/repositories/purchase-bill-line-item.repository.interface';
import { PURCHASE_BILL_REPOSITORY } from './purchases/repositories/purchase-bill.repository.interface';
import { PURCHASE_PAYMENT_REPOSITORY } from './purchases/repositories/purchase-payment.repository.interface';
import { PrismaPurchaseBillLineItemRepository } from './purchases/repositories/prisma-purchase-bill-line-item.repository';
import { PrismaPurchaseBillRepository } from './purchases/repositories/prisma-purchase-bill.repository';
import { PrismaPurchasePaymentRepository } from './purchases/repositories/prisma-purchase-payment.repository';
import { PurchaseBillService } from './purchases/services/purchase-bill.service';
import { RecurringExpensesController } from './recurring/controllers/recurring-expenses.controller';
import { RecurringInvoicesController } from './recurring/controllers/recurring-invoices.controller';
import { RecurringRunController } from './recurring/controllers/recurring-run.controller';
import { RecurringDomainService } from './recurring/domain/recurring-domain.service';
import {
  PrismaRecurringExpenseRepository,
  PrismaRecurringInvoiceRepository,
} from './recurring/repositories/prisma-recurring.repository';
import {
  RECURRING_EXPENSE_REPOSITORY,
  RECURRING_INVOICE_REPOSITORY,
} from './recurring/repositories/recurring.repository.interface';
import {
  RecurringExpenseService,
  RecurringInvoiceService,
  RecurringRunService,
} from './recurring/services/recurring.service';
import { VendorsController } from './vendors/controllers/vendors.controller';
import { VendorDomainService } from './vendors/domain/vendor-domain.service';
import { PrismaVendorRepository } from './vendors/repositories/prisma-vendor.repository';
import { VENDOR_REPOSITORY } from './vendors/repositories/vendor.repository.interface';
import { VendorService } from './vendors/services/vendor.service';

export const FINANCE_SPRINT5_PROVIDERS: Provider[] = [
  { provide: VENDOR_REPOSITORY, useClass: PrismaVendorRepository },
  { provide: EXPENSE_REPOSITORY, useClass: PrismaExpenseRepository },
  { provide: PURCHASE_BILL_REPOSITORY, useClass: PrismaPurchaseBillRepository },
  {
    provide: PURCHASE_BILL_LINE_ITEM_REPOSITORY,
    useClass: PrismaPurchaseBillLineItemRepository,
  },
  { provide: PURCHASE_PAYMENT_REPOSITORY, useClass: PrismaPurchasePaymentRepository },
  { provide: CREDIT_NOTE_REPOSITORY, useClass: PrismaCreditNoteRepository },
  {
    provide: CREDIT_NOTE_APPLICATION_REPOSITORY,
    useClass: PrismaCreditNoteApplicationRepository,
  },
  { provide: RECURRING_INVOICE_REPOSITORY, useClass: PrismaRecurringInvoiceRepository },
  { provide: RECURRING_EXPENSE_REPOSITORY, useClass: PrismaRecurringExpenseRepository },
  { provide: LEDGER_ENTRY_REPOSITORY, useClass: PrismaLedgerEntryRepository },
  VendorDomainService,
  ExpenseDomainService,
  PurchaseBillDomainService,
  CreditNoteDomainService,
  RecurringDomainService,
  VendorService,
  ExpenseService,
  PurchaseBillService,
  CreditNoteService,
  RecurringInvoiceService,
  RecurringExpenseService,
  RecurringRunService,
  LedgerService,
  LedgerPostingService,
];

export const FINANCE_SPRINT5_CONTROLLERS: Type[] = [
  VendorsController,
  ExpensesController,
  PurchaseBillsController,
  PurchaseBillItemsController,
  PurchaseBillPaymentsController,
  PurchasePaymentsController,
  CreditNotesController,
  RecurringInvoicesController,
  RecurringExpensesController,
  RecurringRunController,
  LedgerController,
];

export const FINANCE_SPRINT5_EXPORTS: (Provider | symbol | string | Type)[] = [
  VENDOR_REPOSITORY,
  EXPENSE_REPOSITORY,
  PURCHASE_BILL_REPOSITORY,
  PURCHASE_BILL_LINE_ITEM_REPOSITORY,
  PURCHASE_PAYMENT_REPOSITORY,
  CREDIT_NOTE_REPOSITORY,
  CREDIT_NOTE_APPLICATION_REPOSITORY,
  RECURRING_INVOICE_REPOSITORY,
  RECURRING_EXPENSE_REPOSITORY,
  LEDGER_ENTRY_REPOSITORY,
  VendorDomainService,
  ExpenseDomainService,
  PurchaseBillDomainService,
  CreditNoteDomainService,
  RecurringDomainService,
  VendorService,
  ExpenseService,
  PurchaseBillService,
  CreditNoteService,
  RecurringInvoiceService,
  RecurringExpenseService,
  RecurringRunService,
  LedgerService,
  LedgerPostingService,
];
