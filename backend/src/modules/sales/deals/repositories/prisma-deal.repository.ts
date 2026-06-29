import { Injectable } from '@nestjs/common';
import { Prisma, type Client, type ClientContact, type Deal, type User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  CreateDealData,
  DealRecord,
  DealRepository,
  DealScope,
  FindDealByIdOptions,
  ListDealsParams,
  ListDealsResult,
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

  async create(data: CreateDealData): Promise<DealRecord> {
    const deal = await this.prisma.deal.create({
      data: {
        ...data,
        value: new Prisma.Decimal(data.value),
      },
      include: dealInclude,
    });

    return toDealRecord(deal);
  }

  async update(scope: DealScope, id: string, data: UpdateDealData): Promise<DealRecord | null> {
    const { value, ...rest } = data;

    const result = await this.prisma.deal.updateMany({
      where: activeDealWhere(scope, id),
      data: {
        ...rest,
        ...(value !== undefined ? { value: new Prisma.Decimal(value) } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(
    scope: DealScope,
    id: string,
    options?: FindDealByIdOptions,
  ): Promise<DealRecord | null> {
    const deal = await this.prisma.deal.findFirst({
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

  async list(params: ListDealsParams): Promise<ListDealsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      stage,
      ownerUserId,
      clientId,
      includeArchived = false,
    } = params;

    const where = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(stage !== undefined ? { stage } : {}),
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        include: dealInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      items: items.map(toDealRecord),
      total,
    };
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
    title: deal.title,
    value: deal.value.toNumber(),
    currency: deal.currency,
    expectedCloseDate: deal.expectedCloseDate,
    ownerUserId: deal.ownerUserId,
    ownerDisplayName: deal.ownerUser ? resolveUserDisplayName(deal.ownerUser) : null,
    ownerEmail: deal.ownerUser?.email ?? null,
    stage: deal.stage,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    createdByUserId: deal.createdByUserId,
    updatedByUserId: deal.updatedByUserId,
    deletedAt: deal.deletedAt,
    deletedByUserId: deal.deletedByUserId,
  };
}
