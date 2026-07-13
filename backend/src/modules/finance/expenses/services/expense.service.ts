import { Inject, Injectable } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ActivityService } from '../../../activities/services/activity.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LedgerPostingService } from '../../ledger/services/ledger-posting.service';
import { ExpenseDomainService } from '../domain/expense-domain.service';
import { EXPENSE_DOMAIN_ERROR_CODES, ExpenseDomainError } from '../domain/expense-domain.errors';
import {
  EXPENSE_REPOSITORY,
  type CreateExpenseData,
  type ExpenseRepository,
  type ExpenseTransactionClient,
  type UpdateExpenseData,
} from '../repositories/expense.repository.interface';
import type {
  CreateExpenseCommand,
  ExpenseApplicationContext,
  ExpenseRecord,
  ExpenseScope,
  ListExpensesQuery,
  ListExpensesResult,
  UpdateExpenseCommand,
} from './expense-application.types';

@Injectable()
export class ExpenseService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: ExpenseRepository,
    private readonly expenseDomainService: ExpenseDomainService,
    private readonly activityService: ActivityService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly prisma: PrismaService,
  ) {}

  async createExpense(
    scope: ExpenseScope,
    command: CreateExpenseCommand,
    context: ExpenseApplicationContext,
  ): Promise<ExpenseRecord> {
    this.expenseDomainService.validateCreate({
      category: command.category,
      amount: command.amount,
      taxAmount: command.taxAmount,
      currency: command.currency,
    });

    const now = new Date();
    const data: CreateExpenseData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      vendorId: command.vendorId ?? null,
      category: this.expenseDomainService.normalizeRequiredString(command.category),
      departmentId: command.departmentId ?? null,
      employeeUserId: command.employeeUserId ?? null,
      amount: command.amount,
      taxAmount: command.taxAmount ?? null,
      currency: this.expenseDomainService.normalizeCurrency(command.currency),
      expenseDate: command.expenseDate,
      description: this.expenseDomainService.normalizeOptionalString(command.description),
      approvalStatus: command.approvalStatus ?? 'PENDING',
      attachmentFileId: command.attachmentFileId ?? null,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const created = await this.expenseRepository.create(data, tx);
      await this.activityService.createActivity(
        scope,
        {
          entityType: 'expense',
          entityId: created.id,
          type: ActivityType.CUSTOM,
          title: 'Expense Added',
          description: 'Expense was recorded.',
          metadata: { amount: created.amount, category: created.category },
        },
        { actorUserId: context.actorUserId },
      );
      await this.ledgerPostingService.postExpense(
        scope,
        {
          entryDate: created.expenseDate,
          entityType: 'expense',
          entityId: created.id,
          vendorId: created.vendorId,
          amount: created.amount,
          description: `Expense: ${created.category}`,
          referenceType: 'expense',
          referenceId: created.id,
        },
        { actorUserId: context.actorUserId },
      );
      return created;
    });
  }

  async updateExpense(
    scope: ExpenseScope,
    expenseId: string,
    command: UpdateExpenseCommand,
    context: ExpenseApplicationContext,
  ): Promise<ExpenseRecord> {
    const existing = await this.requireExpense(scope, expenseId);
    this.expenseDomainService.validateUpdate(existing, {
      category: command.category,
      amount: command.amount,
      taxAmount: command.taxAmount,
      currency: command.currency,
    });

    const now = new Date();
    const data: UpdateExpenseData = {
      ...(command.vendorId !== undefined ? { vendorId: command.vendorId } : {}),
      ...(command.category !== undefined
        ? { category: this.expenseDomainService.normalizeRequiredString(command.category) }
        : {}),
      ...(command.departmentId !== undefined ? { departmentId: command.departmentId } : {}),
      ...(command.employeeUserId !== undefined ? { employeeUserId: command.employeeUserId } : {}),
      ...(command.amount !== undefined ? { amount: command.amount } : {}),
      ...(command.taxAmount !== undefined ? { taxAmount: command.taxAmount } : {}),
      ...(command.currency !== undefined
        ? { currency: this.expenseDomainService.normalizeCurrency(command.currency) }
        : {}),
      ...(command.expenseDate !== undefined ? { expenseDate: command.expenseDate } : {}),
      ...(command.description !== undefined
        ? { description: this.expenseDomainService.normalizeOptionalString(command.description) }
        : {}),
      ...(command.attachmentFileId !== undefined
        ? { attachmentFileId: command.attachmentFileId }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async (tx) => {
      const updated = await this.expenseRepository.update(scope, expenseId, data, tx);
      if (updated === null) {
        throw new ExpenseDomainError(
          EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
          'Expense was not found.',
        );
      }
      return updated;
    });
  }

  async approveExpense(
    scope: ExpenseScope,
    expenseId: string,
    context: ExpenseApplicationContext,
  ): Promise<ExpenseRecord> {
    const existing = await this.requireExpense(scope, expenseId);
    this.expenseDomainService.validateApprove(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.expenseRepository.update(
        scope,
        expenseId,
        {
          approvalStatus: 'APPROVED',
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (updated === null) {
        throw new ExpenseDomainError(
          EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
          'Expense was not found.',
        );
      }
      return updated;
    });
  }

  async rejectExpense(
    scope: ExpenseScope,
    expenseId: string,
    context: ExpenseApplicationContext,
  ): Promise<ExpenseRecord> {
    const existing = await this.requireExpense(scope, expenseId);
    this.expenseDomainService.validateReject(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const updated = await this.expenseRepository.update(
        scope,
        expenseId,
        {
          approvalStatus: 'REJECTED',
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (updated === null) {
        throw new ExpenseDomainError(
          EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
          'Expense was not found.',
        );
      }
      return updated;
    });
  }

  async archiveExpense(
    scope: ExpenseScope,
    expenseId: string,
    context: ExpenseApplicationContext,
  ): Promise<ExpenseRecord> {
    const existing = await this.requireExpense(scope, expenseId);
    this.expenseDomainService.validateArchive(existing);
    const now = new Date();

    return this.runInTransaction(async (tx) => {
      const archived = await this.expenseRepository.archive(
        scope,
        expenseId,
        {
          deletedAt: now,
          deletedByUserId: context.actorUserId,
          updatedAt: now,
          updatedByUserId: context.actorUserId,
        },
        tx,
      );
      if (archived === null) {
        throw new ExpenseDomainError(
          EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
          'Expense was not found.',
        );
      }
      return archived;
    });
  }

  async getExpense(scope: ExpenseScope, expenseId: string): Promise<ExpenseRecord> {
    const expense = await this.expenseRepository.findById(scope, expenseId);
    if (expense === null) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
        'Expense was not found.',
      );
    }
    this.expenseDomainService.ensureWorkspaceOwnership(scope, expense);
    return expense;
  }

  async listExpenses(
    scope: ExpenseScope,
    query: ListExpensesQuery = {},
  ): Promise<ListExpensesResult> {
    return this.expenseRepository.list({
      scope,
      skip: query.skip,
      take: query.take,
      q: query.q,
      vendorId: query.vendorId,
      category: query.category,
      approvalStatus: query.approvalStatus,
      employeeUserId: query.employeeUserId,
      includeArchived: query.includeArchived,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  private async runInTransaction<T>(
    work: (tx: ExpenseTransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => work(tx));
  }

  private async requireExpense(scope: ExpenseScope, expenseId: string): Promise<ExpenseRecord> {
    const expense = await this.expenseRepository.findById(scope, expenseId);
    if (expense === null) {
      throw new ExpenseDomainError(
        EXPENSE_DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND,
        'Expense was not found.',
      );
    }
    return expense;
  }
}
