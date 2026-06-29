import { Injectable } from '@nestjs/common';
import { Prisma, type Client, type Deal, type Quote } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateQuoteData,
  FindQuoteByIdOptions,
  ListQuotesParams,
  ListQuotesResult,
  QuoteRecord,
  QuoteRepository,
  QuoteScope,
  UpdateQuoteData,
} from './quote.repository.interface';

type QuoteWithRelations = Quote & {
  deal: Pick<Deal, 'title'>;
  client: Pick<Client, 'displayName'>;
};

@Injectable()
export class PrismaQuoteRepository implements QuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateQuoteData): Promise<QuoteRecord> {
    const quote = await this.prisma.quote.create({
      data: {
        ...data,
        totalAmount: new Prisma.Decimal(data.totalAmount),
      },
      include: quoteInclude,
    });

    return toQuoteRecord(quote);
  }

  async update(scope: QuoteScope, id: string, data: UpdateQuoteData): Promise<QuoteRecord | null> {
    const { totalAmount, ...rest } = data;

    const result = await this.prisma.quote.updateMany({
      where: activeQuoteWhere(scope, id),
      data: {
        ...rest,
        ...(totalAmount !== undefined ? { totalAmount: new Prisma.Decimal(totalAmount) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: QuoteScope,
    id: string,
    options?: FindQuoteByIdOptions,
  ): Promise<QuoteRecord | null> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: quoteInclude,
    });

    return quote ? toQuoteRecord(quote) : null;
  }

  async findByQuoteNumber(scope: QuoteScope, quoteNumber: string): Promise<QuoteRecord | null> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        quoteNumber,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: quoteInclude,
    });

    return quote ? toQuoteRecord(quote) : null;
  }

  async list(params: ListQuotesParams): Promise<ListQuotesResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      status,
      dealId,
      clientId,
      includeArchived = false,
    } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(dealId !== undefined ? { dealId } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        skip,
        take,
        include: quoteInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      items: items.map(toQuoteRecord),
      total,
    };
  }
}

const quoteInclude = {
  deal: {
    select: {
      title: true,
    },
  },
  client: {
    select: {
      displayName: true,
    },
  },
} as const;

function activeQuoteWhere(scope: QuoteScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toQuoteRecord(quote: QuoteWithRelations): QuoteRecord {
  return {
    id: quote.id,
    tenantId: quote.tenantId,
    workspaceId: quote.workspaceId,
    dealId: quote.dealId,
    dealTitle: quote.deal.title,
    clientId: quote.clientId,
    clientName: quote.client.displayName,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    status: quote.status,
    validUntil: quote.validUntil,
    currency: quote.currency,
    totalAmount: quote.totalAmount.toNumber(),
    notes: quote.notes,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    createdByUserId: quote.createdByUserId,
    updatedByUserId: quote.updatedByUserId,
    deletedAt: quote.deletedAt,
    deletedByUserId: quote.deletedByUserId,
  };
}
