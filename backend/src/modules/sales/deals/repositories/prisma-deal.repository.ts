import { Injectable } from '@nestjs/common';
import { Prisma, type Client, type ClientContact, type Deal, type User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveDealData,
  CreateDealData,
  CreateDealStageHistoryData,
  DealListSortField,
  DealRecord,
  DealRepository,
  DealScope,
  DealTransactionClient,
  FindDealByIdOptions,
  ListDealsParams,
  ListDealsResult,
  RestoreDealData,
  UpdateDealData,
} from './deal.repository.interface';

type DealWithRelations = Deal & {
  client: Pick<Client, 'displayName'>;
  contact: Pick<ClientContact, 'firstName' | 'lastName' | 'email'> | null;
  ownerUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
};

@Injectable()
export class PrismaDealRepository implements DealRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDealData, tx?: DealTransactionClient): Promise<DealRecord> {
    const db = tx ?? this.prisma;
    const deal = await db.deal.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        contactId: data.contactId ?? null,
        leadId: data.leadId ?? null,
        title: data.title,
        value: new Prisma.Decimal(data.value),
        currency: data.currency ?? 'USD',
        expectedCloseDate: data.expectedCloseDate ?? null,
        ownerUserId: data.ownerUserId ?? null,
        stage: data.stage ?? 'NEW',
        service: data.service ?? null,
        probability: data.probability ?? 0,
        priority: data.priority ?? 'MEDIUM',
        stageEnteredAt: data.stageEnteredAt ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: dealInclude,
    });

    return toDealRecord(deal);
  }

  async update(
    scope: DealScope,
    id: string,
    data: UpdateDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null> {
    const db = tx ?? this.prisma;
    const { value, ...rest } = data;

    const result = await db.deal.updateMany({
      where: activeDealWhere(scope, id),
      data: {
        ...rest,
        ...(value !== undefined ? { value: new Prisma.Decimal(value) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id, { includeArchived: true });
  }

  async archive(
    scope: DealScope,
    id: string,
    data: ArchiveDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.deal.updateMany({
      where: activeDealWhere(scope, id),
      data: {
        stage: 'ARCHIVED',
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id, { includeArchived: true });
  }

  async restore(
    scope: DealScope,
    id: string,
    data: RestoreDealData,
    tx?: DealTransactionClient,
  ): Promise<DealRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.deal.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        OR: [{ deletedAt: { not: null } }, { stage: 'ARCHIVED' }],
      },
      data: {
        stage: data.stage,
        stageEnteredAt: data.stageEnteredAt,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id, { includeArchived: true });
  }

  async findById(
    scope: DealScope,
    id: string,
    options?: FindDealByIdOptions,
  ): Promise<DealRecord | null> {
    return this.findByIdWithClient(this.prisma, scope, id, options);
  }

  async list(params: ListDealsParams): Promise<ListDealsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      q,
      stage,
      priority,
      ownerUserId,
      clientId,
      leadId,
      probabilityMin,
      probabilityMax,
      includeArchived = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();

    const where: Prisma.DealWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(stage !== undefined ? { stage } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(leadId !== undefined ? { leadId } : {}),
      ...(probabilityMin !== undefined || probabilityMax !== undefined
        ? {
            probability: {
              ...(probabilityMin !== undefined ? { gte: probabilityMin } : {}),
              ...(probabilityMax !== undefined ? { lte: probabilityMax } : {}),
            },
          }
        : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { service: { contains: search, mode: 'insensitive' } },
              { client: { displayName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        include: dealInclude,
        orderBy,
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      items: items.map(toDealRecord),
      total,
    };
  }

  async createStageHistory(
    data: CreateDealStageHistoryData,
    tx?: DealTransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    await db.dealStageHistory.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        dealId: data.dealId,
        fromStage: data.fromStage,
        toStage: data.toStage,
        enteredAt: data.enteredAt,
        changedByUserId: data.changedByUserId ?? null,
      },
    });
  }

  async closeOpenStageHistory(
    scope: DealScope,
    dealId: string,
    exitedAt: Date,
    tx?: DealTransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    const openHistory = await db.dealStageHistory.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        dealId,
        exitedAt: null,
      },
      orderBy: { enteredAt: 'desc' },
    });

    if (openHistory === null) {
      return;
    }

    const durationSeconds = Math.max(
      0,
      Math.round((exitedAt.getTime() - openHistory.enteredAt.getTime()) / 1000),
    );

    await db.dealStageHistory.update({
      where: { id: openHistory.id },
      data: { exitedAt, durationSeconds },
    });
  }

  private async findByIdWithClient(
    db: DealTransactionClient | PrismaService,
    scope: DealScope,
    id: string,
    options?: FindDealByIdOptions,
  ): Promise<DealRecord | null> {
    const deal = await db.deal.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: dealInclude,
    });

    return deal ? toDealRecord(deal) : null;
  }
}

const dealInclude = {
  client: {
    select: {
      displayName: true,
    },
  },
  contact: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  ownerUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeDealWhere(scope: DealScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function buildOrderBy(
  sortBy: DealListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.DealOrderByWithRelationInput {
  switch (sortBy) {
    case 'createdAt':
      return { createdAt: sortOrder };
    case 'value':
      return { value: sortOrder };
    case 'probability':
      return { probability: sortOrder };
    case 'expectedCloseDate':
      return { expectedCloseDate: sortOrder };
    case 'title':
      return { title: sortOrder };
    case 'updatedAt':
    default:
      return { updatedAt: sortOrder };
  }
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function resolveContactName(
  contact: Pick<ClientContact, 'firstName' | 'lastName' | 'email'> | null,
): string | null {
  if (contact === null) {
    return null;
  }

  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
  if (name.length > 0) {
    return name;
  }

  const email = contact.email?.trim() ?? '';
  return email.length > 0 ? email : null;
}

function toDealRecord(deal: DealWithRelations): DealRecord {
  return {
    id: deal.id,
    tenantId: deal.tenantId,
    workspaceId: deal.workspaceId,
    clientId: deal.clientId,
    clientName: deal.client.displayName,
    contactId: deal.contactId,
    contactName: resolveContactName(deal.contact),
    leadId: deal.leadId,
    title: deal.title,
    value: deal.value.toNumber(),
    currency: deal.currency,
    expectedCloseDate: deal.expectedCloseDate,
    ownerUserId: deal.ownerUserId,
    ownerDisplayName: deal.ownerUser ? resolveUserDisplayName(deal.ownerUser) : null,
    ownerEmail: deal.ownerUser?.email ?? null,
    stage: deal.stage,
    service: deal.service,
    probability: deal.probability,
    priority: deal.priority,
    stageEnteredAt: deal.stageEnteredAt,
    convertedProjectId: deal.convertedProjectId,
    wonAt: deal.wonAt,
    lostAt: deal.lostAt,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    createdByUserId: deal.createdByUserId,
    updatedByUserId: deal.updatedByUserId,
    deletedAt: deal.deletedAt,
    deletedByUserId: deal.deletedByUserId,
  };
}
