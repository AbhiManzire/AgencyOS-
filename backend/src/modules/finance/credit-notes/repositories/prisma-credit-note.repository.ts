import { Injectable } from '@nestjs/common';
import { Prisma, type CreditNote, type CreditNoteApplication } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateCreditNoteApplicationData,
  CreateCreditNoteData,
  CreditNoteApplicationRecord,
  CreditNoteApplicationRepository,
  CreditNoteRecord,
  CreditNoteRepository,
  CreditNoteScope,
  CreditNoteTransactionClient,
  ListCreditNotesParams,
  ListCreditNotesResult,
  UpdateCreditNoteData,
} from './credit-note.repository.interface';

@Injectable()
export class PrismaCreditNoteRepository implements CreditNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateCreditNoteData,
    tx?: CreditNoteTransactionClient,
  ): Promise<CreditNoteRecord> {
    const db = tx ?? this.prisma;
    const note = await db.creditNote.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        invoiceId: data.invoiceId ?? null,
        creditNoteNumber: data.creditNoteNumber,
        issueDate: data.issueDate,
        amount: new Prisma.Decimal(data.amount),
        taxAmount:
          data.taxAmount === undefined || data.taxAmount === null
            ? null
            : new Prisma.Decimal(data.taxAmount),
        currency: data.currency,
        status: data.status ?? 'DRAFT',
        appliedAmount: new Prisma.Decimal(data.appliedAmount ?? 0),
        notes: data.notes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
    });
    return toCreditNoteRecord(note);
  }

  async update(
    scope: CreditNoteScope,
    id: string,
    data: UpdateCreditNoteData,
    tx?: CreditNoteTransactionClient,
  ): Promise<CreditNoteRecord | null> {
    const db = tx ?? this.prisma;
    const { appliedAmount, ...rest } = data;
    const result = await db.creditNote.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      data: {
        ...rest,
        ...(appliedAmount !== undefined
          ? { appliedAmount: new Prisma.Decimal(appliedAmount) }
          : {}),
      },
    });
    if (result.count === 0) return null;
    const note = await db.creditNote.findFirst({
      where: { id, tenantId: scope.tenantId, workspaceId: scope.workspaceId },
    });
    return note ? toCreditNoteRecord(note) : null;
  }

  async findById(scope: CreditNoteScope, id: string): Promise<CreditNoteRecord | null> {
    const note = await this.prisma.creditNote.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
    });
    return note ? toCreditNoteRecord(note) : null;
  }

  async list(params: ListCreditNotesParams): Promise<ListCreditNotesResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      clientId,
      invoiceId,
      status,
      includeArchived = false,
    } = params;

    const where: Prisma.CreditNoteWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(invoiceId !== undefined ? { invoiceId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.creditNote.findMany({
        where,
        skip,
        take,
        orderBy: { issueDate: 'desc' },
      }),
      this.prisma.creditNote.count({ where }),
    ]);

    return { items: items.map(toCreditNoteRecord), total };
  }
}

@Injectable()
export class PrismaCreditNoteApplicationRepository implements CreditNoteApplicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateCreditNoteApplicationData,
    tx?: CreditNoteTransactionClient,
  ): Promise<CreditNoteApplicationRecord> {
    const db = tx ?? this.prisma;
    const application = await db.creditNoteApplication.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        creditNoteId: data.creditNoteId,
        invoiceId: data.invoiceId,
        amount: new Prisma.Decimal(data.amount),
        appliedAt: data.appliedAt,
        createdAt: data.createdAt,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
    return toApplicationRecord(application);
  }
}

function toCreditNoteRecord(note: CreditNote): CreditNoteRecord {
  return {
    id: note.id,
    tenantId: note.tenantId,
    workspaceId: note.workspaceId,
    clientId: note.clientId,
    invoiceId: note.invoiceId,
    creditNoteNumber: note.creditNoteNumber,
    issueDate: note.issueDate,
    amount: Number(note.amount),
    taxAmount: note.taxAmount === null ? null : Number(note.taxAmount),
    currency: note.currency,
    status: note.status,
    appliedAmount: Number(note.appliedAmount),
    notes: note.notes,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    createdByUserId: note.createdByUserId,
    updatedByUserId: note.updatedByUserId,
    deletedAt: note.deletedAt,
    deletedByUserId: note.deletedByUserId,
  };
}

function toApplicationRecord(app: CreditNoteApplication): CreditNoteApplicationRecord {
  return {
    id: app.id,
    tenantId: app.tenantId,
    workspaceId: app.workspaceId,
    creditNoteId: app.creditNoteId,
    invoiceId: app.invoiceId,
    amount: Number(app.amount),
    appliedAt: app.appliedAt,
    createdAt: app.createdAt,
    createdByUserId: app.createdByUserId,
  };
}
