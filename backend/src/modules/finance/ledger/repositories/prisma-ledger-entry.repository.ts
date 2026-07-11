import { Injectable } from '@nestjs/common';
import { Prisma, type LedgerEntry } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateLedgerEntryData,
  LedgerEntryRecord,
  LedgerEntryRepository,
  LedgerTransactionClient,
  ListLedgerEntriesParams,
  ListLedgerEntriesResult,
} from './ledger-entry.repository.interface';

@Injectable()
export class PrismaLedgerEntryRepository implements LedgerEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateLedgerEntryData,
    tx?: LedgerTransactionClient,
  ): Promise<LedgerEntryRecord> {
    const db = tx ?? this.prisma;
    const entry = await db.ledgerEntry.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        entryDate: data.entryDate,
        accountType: data.accountType,
        entityType: data.entityType,
        entityId: data.entityId,
        clientId: data.clientId ?? null,
        vendorId: data.vendorId ?? null,
        debit: new Prisma.Decimal(data.debit),
        credit: new Prisma.Decimal(data.credit),
        balanceAfter:
          data.balanceAfter === undefined || data.balanceAfter === null
            ? null
            : new Prisma.Decimal(data.balanceAfter),
        description: data.description ?? null,
        referenceType: data.referenceType ?? null,
        referenceId: data.referenceId ?? null,
        createdAt: data.createdAt,
        createdByUserId: data.createdByUserId ?? null,
      },
    });
    return toRecord(entry);
  }

  async list(params: ListLedgerEntriesParams): Promise<ListLedgerEntriesResult> {
    const { scope, skip = 0, take = 25, clientId, vendorId, accountType } = params;

    const where: Prisma.LedgerEntryWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(clientId !== undefined ? { clientId } : {}),
      ...(vendorId !== undefined ? { vendorId } : {}),
      ...(accountType !== undefined ? { accountType } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ledgerEntry.findMany({
        where,
        skip,
        take,
        orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return { items: items.map(toRecord), total };
  }
}

function toRecord(entry: LedgerEntry): LedgerEntryRecord {
  return {
    id: entry.id,
    tenantId: entry.tenantId,
    workspaceId: entry.workspaceId,
    entryDate: entry.entryDate,
    accountType: entry.accountType,
    entityType: entry.entityType,
    entityId: entry.entityId,
    clientId: entry.clientId,
    vendorId: entry.vendorId,
    debit: Number(entry.debit),
    credit: Number(entry.credit),
    balanceAfter: entry.balanceAfter === null ? null : Number(entry.balanceAfter),
    description: entry.description,
    referenceType: entry.referenceType,
    referenceId: entry.referenceId,
    createdAt: entry.createdAt,
    createdByUserId: entry.createdByUserId,
  };
}
