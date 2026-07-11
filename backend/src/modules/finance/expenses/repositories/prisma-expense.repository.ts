import { Injectable } from '@nestjs/common';
import { Prisma, type Expense } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveExpenseData,
  CreateExpenseData,
  ExpenseListSortField,
  ExpenseRecord,
  ExpenseRepository,
  ExpenseScope,
  ExpenseTransactionClient,
  FindExpenseByIdOptions,
  ListExpensesParams,
  ListExpensesResult,
  UpdateExpenseData,
} from './expense.repository.interface';

@Injectable()
export class PrismaExpenseRepository implements ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateExpenseData, tx?: ExpenseTransactionClient): Promise<ExpenseRecord> {
    const db = tx ?? this.prisma;
    const expense = await db.expense.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        vendorId: data.vendorId ?? null,
        category: data.category,
        departmentId: data.departmentId ?? null,
        employeeUserId: data.employeeUserId ?? null,
        amount: new Prisma.Decimal(data.amount),
        taxAmount:
          data.taxAmount === undefined || data.taxAmount === null
            ? null
            : new Prisma.Decimal(data.taxAmount),
        currency: data.currency,
        expenseDate: data.expenseDate,
        description: data.description ?? null,
        approvalStatus: data.approvalStatus ?? 'PENDING',
        attachmentFileId: data.attachmentFileId ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toExpenseRecord(expense);
  }

  async update(
    scope: ExpenseScope,
    id: string,
    data: UpdateExpenseData,
    tx?: ExpenseTransactionClient,
  ): Promise<ExpenseRecord | null> {
    const db = tx ?? this.prisma;
    const { amount, taxAmount, ...rest } = data;
    const result = await db.expense.updateMany({
      where: activeWhere(scope, id),
      data: {
        ...rest,
        ...(amount !== undefined ? { amount: new Prisma.Decimal(amount) } : {}),
        ...(taxAmount !== undefined
          ? { taxAmount: taxAmount === null ? null : new Prisma.Decimal(taxAmount) }
          : {}),
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async archive(
    scope: ExpenseScope,
    id: string,
    data: ArchiveExpenseData,
    tx?: ExpenseTransactionClient,
  ): Promise<ExpenseRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.expense.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });
    if (result.count === 0) return null;
    return this.findByIdWithClient(db, scope, id);
  }

  async findById(
    scope: ExpenseScope,
    id: string,
    options?: FindExpenseByIdOptions,
  ): Promise<ExpenseRecord | null> {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
    });
    return expense ? toExpenseRecord(expense) : null;
  }

  async list(params: ListExpensesParams): Promise<ListExpensesResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      q,
      vendorId,
      category,
      approvalStatus,
      employeeUserId,
      includeArchived = false,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();
    const where: Prisma.ExpenseWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(vendorId !== undefined ? { vendorId } : {}),
      ...(category !== undefined ? { category: { equals: category, mode: 'insensitive' } } : {}),
      ...(approvalStatus !== undefined ? { approvalStatus } : {}),
      ...(employeeUserId !== undefined ? { employeeUserId } : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { category: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: buildOrderBy(sortBy, sortOrder),
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { items: items.map(toExpenseRecord), total };
  }

  private async findByIdWithClient(
    db: ExpenseTransactionClient | PrismaService,
    scope: ExpenseScope,
    id: string,
  ): Promise<ExpenseRecord | null> {
    const expense = await db.expense.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return expense ? toExpenseRecord(expense) : null;
  }
}

function activeWhere(scope: ExpenseScope, id: string) {
  return { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId, deletedAt: null };
}

function buildOrderBy(
  sortBy: ExpenseListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.ExpenseOrderByWithRelationInput {
  switch (sortBy) {
    case 'amount':
      return { amount: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'updatedAt':
      return { updatedAt: sortOrder };
    case 'expenseDate':
    default:
      return { expenseDate: sortOrder };
  }
}

function toExpenseRecord(expense: Expense): ExpenseRecord {
  return {
    id: expense.id,
    tenantId: expense.tenantId,
    workspaceId: expense.workspaceId,
    vendorId: expense.vendorId,
    category: expense.category,
    departmentId: expense.departmentId,
    employeeUserId: expense.employeeUserId,
    amount: Number(expense.amount),
    taxAmount: expense.taxAmount === null ? null : Number(expense.taxAmount),
    currency: expense.currency,
    expenseDate: expense.expenseDate,
    description: expense.description,
    approvalStatus: expense.approvalStatus,
    attachmentFileId: expense.attachmentFileId,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    createdByUserId: expense.createdByUserId,
    updatedByUserId: expense.updatedByUserId,
    deletedAt: expense.deletedAt,
    deletedByUserId: expense.deletedByUserId,
  };
}
