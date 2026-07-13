import { Injectable } from '@nestjs/common';
import { Prisma, type Client, type ClientContact, type Deal, type User } from '@prisma/client';
import { OPEN_STAGES } from '../domain/deal-domain.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveDealData,
  CreateDealData,
  CreateDealStageHistoryData,
  DealCloseDateCandidate,
  DealDashboardAggregate,
  DealForecastAggregate,
  DealForecastQuery,
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
        pipelineId: data.pipelineId ?? null,
        pipelineStageId: data.pipelineStageId ?? null,
        title: data.title,
        description: data.description ?? null,
        value: new Prisma.Decimal(data.value),
        currency: data.currency ?? 'USD',
        expectedCloseDate: data.expectedCloseDate ?? null,
        ownerUserId: data.ownerUserId ?? null,
        stage: data.stage ?? 'QUALIFICATION',
        status: data.status ?? 'OPEN',
        source: data.source ?? null,
        forecastCategory: data.forecastCategory ?? 'PIPELINE',
        service: data.service ?? null,
        probability: data.probability ?? 10,
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
        status: 'ARCHIVED',
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
        OR: [{ deletedAt: { not: null } }, { stage: 'ARCHIVED' }, { status: 'ARCHIVED' }],
      },
      data: {
        stage: data.stage,
        status: data.status,
        forecastCategory: data.forecastCategory,
        probability: data.probability,
        pipelineId: data.pipelineId ?? undefined,
        pipelineStageId: data.pipelineStageId ?? undefined,
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
      status,
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
      ...(status !== undefined ? { status } : {}),
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

  async getForecastAggregate(
    scope: DealScope,
    query: DealForecastQuery,
  ): Promise<DealForecastAggregate> {
    const openWhere: Prisma.DealWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      status: 'OPEN',
      stage: { in: [...OPEN_STAGES] },
    };

    const openDeals = await this.prisma.deal.findMany({
      where: openWhere,
      select: {
        value: true,
        probability: true,
        expectedCloseDate: true,
      },
    });

    let pipelineValue = 0;
    let weightedForecast = 0;
    let expectedRevenue = 0;

    for (const deal of openDeals) {
      const value = deal.value.toNumber();
      const probability = deal.probability ?? 0;
      pipelineValue += value;
      weightedForecast += (value * probability) / 100;

      if (
        deal.expectedCloseDate !== null &&
        deal.expectedCloseDate >= query.periodStart &&
        deal.expectedCloseDate <= query.periodEnd
      ) {
        expectedRevenue += value;
      }
    }

    const [wonAgg, lostAgg] = await Promise.all([
      this.prisma.deal.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          stage: 'WON',
          wonAt: { gte: query.periodStart, lte: query.periodEnd },
        },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: {
          tenantId: scope.tenantId,
          workspaceId: scope.workspaceId,
          deletedAt: null,
          stage: 'LOST',
          lostAt: { gte: query.periodStart, lte: query.periodEnd },
        },
        _sum: { value: true },
      }),
    ]);

    return {
      pipelineValue: roundMoney(pipelineValue),
      weightedForecast: roundMoney(weightedForecast),
      expectedRevenue: roundMoney(expectedRevenue),
      wonRevenue: wonAgg._sum.value?.toNumber() ?? 0,
      lostRevenue: lostAgg._sum.value?.toNumber() ?? 0,
    };
  }

  async getDashboardAggregate(
    scope: DealScope,
    monthStart: Date,
    monthEnd: Date,
  ): Promise<DealDashboardAggregate> {
    const baseScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
    };

    const [
      openDeals,
      wonThisMonth,
      lostThisMonth,
      openValueRows,
      wonAgg,
      decidedWon,
      decidedLost,
      recentWins,
    ] = await Promise.all([
      this.prisma.deal.count({
        where: { ...baseScope, status: 'OPEN', stage: { in: [...OPEN_STAGES] } },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          stage: 'WON',
          wonAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.deal.count({
        where: {
          ...baseScope,
          stage: 'LOST',
          lostAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.deal.findMany({
        where: { ...baseScope, status: 'OPEN', stage: { in: [...OPEN_STAGES] } },
        select: { value: true, probability: true },
      }),
      this.prisma.deal.aggregate({
        where: { ...baseScope, stage: 'WON' },
        _avg: { value: true },
        _count: { _all: true },
      }),
      this.prisma.deal.count({
        where: { ...baseScope, stage: 'WON' },
      }),
      this.prisma.deal.count({
        where: { ...baseScope, stage: 'LOST' },
      }),
      this.prisma.deal.findMany({
        where: {
          ...baseScope,
          stage: 'WON',
          wonAt: { not: null },
        },
        select: { createdAt: true, wonAt: true },
        orderBy: { wonAt: 'desc' },
        take: 50,
      }),
    ]);

    let pipelineValue = 0;
    let weightedForecast = 0;
    for (const row of openValueRows) {
      const value = row.value.toNumber();
      pipelineValue += value;
      weightedForecast += (value * (row.probability ?? 0)) / 100;
    }

    const decidedTotal = decidedWon + decidedLost;
    const winRate = decidedTotal === 0 ? 0 : roundMoney((decidedWon / decidedTotal) * 100);

    let salesVelocityDays: number | null = null;
    if (recentWins.length > 0) {
      const totalDays = recentWins.reduce((sum, deal) => {
        if (deal.wonAt === null) {
          return sum;
        }
        return sum + (deal.wonAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      salesVelocityDays = roundMoney(totalDays / recentWins.length);
    }

    return {
      openDeals,
      wonThisMonth,
      lostThisMonth,
      pipelineValue: roundMoney(pipelineValue),
      weightedForecast: roundMoney(weightedForecast),
      averageDealSize: wonAgg._avg.value?.toNumber() ?? 0,
      winRate,
      salesVelocityDays,
    };
  }

  async findOpenDealsWithCloseDateBetween(
    fromInclusive: Date,
    toInclusive: Date,
  ): Promise<readonly DealCloseDateCandidate[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        deletedAt: null,
        status: 'OPEN',
        stage: { in: [...OPEN_STAGES] },
        expectedCloseDate: {
          gte: fromInclusive,
          lte: toInclusive,
        },
      },
      select: {
        id: true,
        title: true,
        ownerUserId: true,
        expectedCloseDate: true,
        status: true,
        stage: true,
        tenantId: true,
        workspaceId: true,
      },
    });

    return deals
      .filter(
        (deal): deal is typeof deal & { expectedCloseDate: Date } =>
          deal.expectedCloseDate !== null,
      )
      .map((deal) => ({
        id: deal.id,
        tenantId: deal.tenantId,
        workspaceId: deal.workspaceId,
        title: deal.title,
        ownerUserId: deal.ownerUserId,
        expectedCloseDate: deal.expectedCloseDate,
        status: deal.status,
        stage: deal.stage,
      }));
  }

  async findOverdueOpenDeals(beforeDate: Date): Promise<readonly DealCloseDateCandidate[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        deletedAt: null,
        status: 'OPEN',
        stage: { in: [...OPEN_STAGES] },
        expectedCloseDate: { lt: beforeDate },
      },
      select: {
        id: true,
        title: true,
        ownerUserId: true,
        expectedCloseDate: true,
        status: true,
        stage: true,
        tenantId: true,
        workspaceId: true,
      },
    });

    return deals
      .filter(
        (deal): deal is typeof deal & { expectedCloseDate: Date } =>
          deal.expectedCloseDate !== null,
      )
      .map((deal) => ({
        id: deal.id,
        tenantId: deal.tenantId,
        workspaceId: deal.workspaceId,
        title: deal.title,
        ownerUserId: deal.ownerUserId,
        expectedCloseDate: deal.expectedCloseDate,
        status: deal.status,
        stage: deal.stage,
      }));
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
    pipelineId: deal.pipelineId,
    pipelineStageId: deal.pipelineStageId,
    title: deal.title,
    description: deal.description,
    value: deal.value.toNumber(),
    currency: deal.currency,
    expectedCloseDate: deal.expectedCloseDate,
    ownerUserId: deal.ownerUserId,
    ownerDisplayName: deal.ownerUser ? resolveUserDisplayName(deal.ownerUser) : null,
    ownerEmail: deal.ownerUser?.email ?? null,
    stage: deal.stage,
    status: deal.status,
    source: deal.source,
    forecastCategory: deal.forecastCategory,
    service: deal.service,
    probability: deal.probability,
    priority: deal.priority,
    stageEnteredAt: deal.stageEnteredAt,
    convertedProjectId: deal.convertedProjectId,
    wonAt: deal.wonAt,
    lostAt: deal.lostAt,
    lossReason: deal.lossReason,
    competitor: deal.competitor,
    lossNotes: deal.lossNotes,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    createdByUserId: deal.createdByUserId,
    updatedByUserId: deal.updatedByUserId,
    deletedAt: deal.deletedAt,
    deletedByUserId: deal.deletedByUserId,
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
