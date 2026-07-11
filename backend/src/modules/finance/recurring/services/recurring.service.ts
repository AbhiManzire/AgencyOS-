import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { RecurringDomainService } from '../domain/recurring-domain.service';
import {
  RECURRING_DOMAIN_ERROR_CODES,
  RecurringDomainError,
} from '../domain/recurring-domain.errors';
import {
  RECURRING_EXPENSE_REPOSITORY,
  RECURRING_INVOICE_REPOSITORY,
  type CreateRecurringData,
  type RecurringExpenseRepository,
  type RecurringInvoiceRepository,
  type RecurringTransactionClient,
  type UpdateRecurringData,
} from '../repositories/recurring.repository.interface';
import type {
  CreateRecurringCommand,
  ListRecurringExpensesResult,
  ListRecurringInvoicesResult,
  ListRecurringQuery,
  RecurringApplicationContext,
  RecurringExpenseRecord,
  RecurringInvoiceRecord,
  RecurringScope,
  RunDueResult,
  UpdateRecurringCommand,
} from './recurring-application.types';

@Injectable()
export class RecurringInvoiceService {
  constructor(
    @Inject(RECURRING_INVOICE_REPOSITORY)
    private readonly repository: RecurringInvoiceRepository,
    private readonly domainService: RecurringDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    scope: RecurringScope,
    command: CreateRecurringCommand,
    context: RecurringApplicationContext,
  ): Promise<RecurringInvoiceRecord> {
    this.domainService.validateCreate(command);
    const now = new Date();
    const data: CreateRecurringData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      frequency: command.frequency,
      nextRunAt: command.nextRunAt,
      isActive: command.isActive ?? true,
      template: command.template,
      reminderDaysBefore: command.reminderDaysBefore ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };
    return this.prisma.$transaction(async (tx) => this.repository.create(data, tx));
  }

  async update(
    scope: RecurringScope,
    id: string,
    command: UpdateRecurringCommand,
    context: RecurringApplicationContext,
  ): Promise<RecurringInvoiceRecord> {
    const existing = await this.require(scope, id);
    if (command.frequency !== undefined || command.template !== undefined) {
      this.domainService.validateCreate({
        frequency: command.frequency ?? existing.frequency,
        nextRunAt: command.nextRunAt ?? existing.nextRunAt,
        template: command.template ?? existing.template,
      });
    }
    const now = new Date();
    const data: UpdateRecurringData = {
      ...command,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };
    return this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.update(scope, id, data, tx);
      if (updated === null) {
        throw new RecurringDomainError(
          RECURRING_DOMAIN_ERROR_CODES.RECURRING_INVOICE_NOT_FOUND,
          'Recurring invoice was not found.',
        );
      }
      return updated;
    });
  }

  async archive(
    scope: RecurringScope,
    id: string,
    context: RecurringApplicationContext,
  ): Promise<RecurringInvoiceRecord> {
    await this.require(scope, id);
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const archived = await this.repository.archive(
        scope,
        id,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (archived === null) {
        throw new RecurringDomainError(
          RECURRING_DOMAIN_ERROR_CODES.RECURRING_INVOICE_NOT_FOUND,
          'Recurring invoice was not found.',
        );
      }
      return archived;
    });
  }

  async get(scope: RecurringScope, id: string): Promise<RecurringInvoiceRecord> {
    return this.require(scope, id);
  }

  async list(
    scope: RecurringScope,
    query: ListRecurringQuery = {},
  ): Promise<ListRecurringInvoicesResult> {
    return this.repository.list({
      scope,
      skip: query.skip,
      take: query.take,
      isActive: query.isActive,
      includeArchived: query.includeArchived,
    });
  }

  private async require(scope: RecurringScope, id: string): Promise<RecurringInvoiceRecord> {
    const row = await this.repository.findById(scope, id);
    if (row === null) {
      throw new RecurringDomainError(
        RECURRING_DOMAIN_ERROR_CODES.RECURRING_INVOICE_NOT_FOUND,
        'Recurring invoice was not found.',
      );
    }
    return row;
  }
}

@Injectable()
export class RecurringExpenseService {
  constructor(
    @Inject(RECURRING_EXPENSE_REPOSITORY)
    private readonly repository: RecurringExpenseRepository,
    private readonly domainService: RecurringDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    scope: RecurringScope,
    command: CreateRecurringCommand,
    context: RecurringApplicationContext,
  ): Promise<RecurringExpenseRecord> {
    this.domainService.validateCreate(command);
    const now = new Date();
    const data: CreateRecurringData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      frequency: command.frequency,
      nextRunAt: command.nextRunAt,
      isActive: command.isActive ?? true,
      template: command.template,
      reminderDaysBefore: command.reminderDaysBefore ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };
    return this.prisma.$transaction(async (tx) => this.repository.create(data, tx));
  }

  async update(
    scope: RecurringScope,
    id: string,
    command: UpdateRecurringCommand,
    context: RecurringApplicationContext,
  ): Promise<RecurringExpenseRecord> {
    const existing = await this.require(scope, id);
    if (command.frequency !== undefined || command.template !== undefined) {
      this.domainService.validateCreate({
        frequency: command.frequency ?? existing.frequency,
        nextRunAt: command.nextRunAt ?? existing.nextRunAt,
        template: command.template ?? existing.template,
      });
    }
    const now = new Date();
    const data: UpdateRecurringData = {
      ...command,
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };
    return this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.update(scope, id, data, tx);
      if (updated === null) {
        throw new RecurringDomainError(
          RECURRING_DOMAIN_ERROR_CODES.RECURRING_EXPENSE_NOT_FOUND,
          'Recurring expense was not found.',
        );
      }
      return updated;
    });
  }

  async archive(
    scope: RecurringScope,
    id: string,
    context: RecurringApplicationContext,
  ): Promise<RecurringExpenseRecord> {
    await this.require(scope, id);
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const archived = await this.repository.archive(
        scope,
        id,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (archived === null) {
        throw new RecurringDomainError(
          RECURRING_DOMAIN_ERROR_CODES.RECURRING_EXPENSE_NOT_FOUND,
          'Recurring expense was not found.',
        );
      }
      return archived;
    });
  }

  async get(scope: RecurringScope, id: string): Promise<RecurringExpenseRecord> {
    return this.require(scope, id);
  }

  async list(
    scope: RecurringScope,
    query: ListRecurringQuery = {},
  ): Promise<ListRecurringExpensesResult> {
    return this.repository.list({
      scope,
      skip: query.skip,
      take: query.take,
      isActive: query.isActive,
      includeArchived: query.includeArchived,
    });
  }

  private async require(scope: RecurringScope, id: string): Promise<RecurringExpenseRecord> {
    const row = await this.repository.findById(scope, id);
    if (row === null) {
      throw new RecurringDomainError(
        RECURRING_DOMAIN_ERROR_CODES.RECURRING_EXPENSE_NOT_FOUND,
        'Recurring expense was not found.',
      );
    }
    return row;
  }
}

@Injectable()
export class RecurringRunService {
  constructor(
    @Inject(RECURRING_INVOICE_REPOSITORY)
    private readonly invoiceRepository: RecurringInvoiceRepository,
    @Inject(RECURRING_EXPENSE_REPOSITORY)
    private readonly expenseRepository: RecurringExpenseRepository,
    private readonly domainService: RecurringDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async runDue(scope: RecurringScope, context: RecurringApplicationContext): Promise<RunDueResult> {
    const now = new Date();

    return this.prisma.$transaction(async (tx: RecurringTransactionClient) => {
      const dueInvoices = await this.invoiceRepository.listDue(scope, now, tx);
      const dueExpenses = await this.expenseRepository.listDue(scope, now, tx);

      for (const invoice of dueInvoices) {
        await this.invoiceRepository.update(
          scope,
          invoice.id,
          {
            lastRunAt: now,
            nextRunAt: this.domainService.advanceNextRunAt(invoice.nextRunAt, invoice.frequency),
            updatedAt: now,
            updatedByUserId: context.actorUserId,
          },
          tx,
        );
      }

      for (const expense of dueExpenses) {
        await this.expenseRepository.update(
          scope,
          expense.id,
          {
            lastRunAt: now,
            nextRunAt: this.domainService.advanceNextRunAt(expense.nextRunAt, expense.frequency),
            updatedAt: now,
            updatedByUserId: context.actorUserId,
          },
          tx,
        );
      }

      return {
        invoicesAdvanced: dueInvoices.length,
        expensesAdvanced: dueExpenses.length,
      };
    });
  }
}
