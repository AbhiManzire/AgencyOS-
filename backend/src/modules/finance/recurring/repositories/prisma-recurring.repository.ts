import { Injectable } from '@nestjs/common';
import { Prisma, type RecurringExpense, type RecurringInvoice } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveRecurringData,
  CreateRecurringData,
  ListRecurringExpensesResult,
  ListRecurringInvoicesResult,
  ListRecurringParams,
  RecurringExpenseRecord,
  RecurringExpenseRepository,
  RecurringInvoiceRecord,
  RecurringInvoiceRepository,
  RecurringScope,
  RecurringTransactionClient,
  UpdateRecurringData,
} from './recurring.repository.interface';

function toTemplate(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
}

function toInvoiceRecord(row: RecurringInvoice): RecurringInvoiceRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    frequency: row.frequency,
    nextRunAt: row.nextRunAt,
    lastRunAt: row.lastRunAt,
    isActive: row.isActive,
    template: toTemplate(row.template),
    reminderDaysBefore: row.reminderDaysBefore,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    deletedAt: row.deletedAt,
    deletedByUserId: row.deletedByUserId,
  };
}

function toExpenseRecord(row: RecurringExpense): RecurringExpenseRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    workspaceId: row.workspaceId,
    frequency: row.frequency,
    nextRunAt: row.nextRunAt,
    lastRunAt: row.lastRunAt,
    isActive: row.isActive,
    template: toTemplate(row.template),
    reminderDaysBefore: row.reminderDaysBefore,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    deletedAt: row.deletedAt,
    deletedByUserId: row.deletedByUserId,
  };
}

@Injectable()
export class PrismaRecurringInvoiceRepository implements RecurringInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord> {
    const db = tx ?? this.prisma;
    const row = await db.recurringInvoice.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        frequency: data.frequency,
        nextRunAt: data.nextRunAt,
        isActive: data.isActive ?? true,
        template: data.template as Prisma.InputJsonValue,
        reminderDaysBefore: data.reminderDaysBefore ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toInvoiceRecord(row);
  }

  async update(
    scope: RecurringScope,
    id: string,
    data: UpdateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord | null> {
    const db = tx ?? this.prisma;
    const { template, ...rest } = data;
    const result = await db.recurringInvoice.updateMany({
      where: activeWhere(scope, id),
      data: {
        ...rest,
        ...(template !== undefined ? { template: template as Prisma.InputJsonValue } : {}),
      },
    });
    if (result.count === 0) return null;
    const row = await db.recurringInvoice.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return row ? toInvoiceRecord(row) : null;
  }

  async archive(
    scope: RecurringScope,
    id: string,
    data: ArchiveRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringInvoiceRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.recurringInvoice.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
        isActive: false,
      },
    });
    if (result.count === 0) return null;
    const row = await db.recurringInvoice.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return row ? toInvoiceRecord(row) : null;
  }

  async findById(scope: RecurringScope, id: string): Promise<RecurringInvoiceRecord | null> {
    const row = await this.prisma.recurringInvoice.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });
    return row ? toInvoiceRecord(row) : null;
  }

  async list(params: ListRecurringParams): Promise<ListRecurringInvoicesResult> {
    const { scope, skip = 0, take = 25, isActive, includeArchived = false } = params;
    const where: Prisma.RecurringInvoiceWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(isActive !== undefined ? { isActive } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurringInvoice.findMany({
        where,
        skip,
        take,
        orderBy: { nextRunAt: 'asc' },
      }),
      this.prisma.recurringInvoice.count({ where }),
    ]);
    return { items: items.map(toInvoiceRecord), total };
  }

  async listDue(
    scope: RecurringScope,
    asOf: Date,
    tx?: RecurringTransactionClient,
  ): Promise<readonly RecurringInvoiceRecord[]> {
    const db = tx ?? this.prisma;
    const rows = await db.recurringInvoice.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        isActive: true,
        nextRunAt: { lte: asOf },
      },
      orderBy: { nextRunAt: 'asc' },
    });
    return rows.map(toInvoiceRecord);
  }
}

@Injectable()
export class PrismaRecurringExpenseRepository implements RecurringExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord> {
    const db = tx ?? this.prisma;
    const row = await db.recurringExpense.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        frequency: data.frequency,
        nextRunAt: data.nextRunAt,
        isActive: data.isActive ?? true,
        template: data.template as Prisma.InputJsonValue,
        reminderDaysBefore: data.reminderDaysBefore ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toExpenseRecord(row);
  }

  async update(
    scope: RecurringScope,
    id: string,
    data: UpdateRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord | null> {
    const db = tx ?? this.prisma;
    const { template, ...rest } = data;
    const result = await db.recurringExpense.updateMany({
      where: activeWhere(scope, id),
      data: {
        ...rest,
        ...(template !== undefined ? { template: template as Prisma.InputJsonValue } : {}),
      },
    });
    if (result.count === 0) return null;
    const row = await db.recurringExpense.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return row ? toExpenseRecord(row) : null;
  }

  async archive(
    scope: RecurringScope,
    id: string,
    data: ArchiveRecurringData,
    tx?: RecurringTransactionClient,
  ): Promise<RecurringExpenseRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.recurringExpense.updateMany({
      where: activeWhere(scope, id),
      data: {
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
        isActive: false,
      },
    });
    if (result.count === 0) return null;
    const row = await db.recurringExpense.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return row ? toExpenseRecord(row) : null;
  }

  async findById(scope: RecurringScope, id: string): Promise<RecurringExpenseRecord | null> {
    const row = await this.prisma.recurringExpense.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });
    return row ? toExpenseRecord(row) : null;
  }

  async list(params: ListRecurringParams): Promise<ListRecurringExpensesResult> {
    const { scope, skip = 0, take = 25, isActive, includeArchived = false } = params;
    const where: Prisma.RecurringExpenseWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(isActive !== undefined ? { isActive } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurringExpense.findMany({
        where,
        skip,
        take,
        orderBy: { nextRunAt: 'asc' },
      }),
      this.prisma.recurringExpense.count({ where }),
    ]);
    return { items: items.map(toExpenseRecord), total };
  }

  async listDue(
    scope: RecurringScope,
    asOf: Date,
    tx?: RecurringTransactionClient,
  ): Promise<readonly RecurringExpenseRecord[]> {
    const db = tx ?? this.prisma;
    const rows = await db.recurringExpense.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        isActive: true,
        nextRunAt: { lte: asOf },
      },
      orderBy: { nextRunAt: 'asc' },
    });
    return rows.map(toExpenseRecord);
  }
}

function activeWhere(scope: RecurringScope, id: string) {
  return { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId, deletedAt: null };
}
