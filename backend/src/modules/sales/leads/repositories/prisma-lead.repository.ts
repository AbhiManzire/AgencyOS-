import { Injectable } from '@nestjs/common';
import { Prisma, type Lead, type User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ArchiveLeadData,
  ConvertLeadData,
  CreateLeadData,
  FindLeadByIdOptions,
  LeadListSortField,
  LeadRecord,
  LeadRepository,
  LeadScope,
  LeadTransactionClient,
  ListLeadsParams,
  ListLeadsResult,
  RestoreLeadData,
  UpdateLeadData,
} from './lead.repository.interface';

type LeadWithRelations = Lead & {
  assignedToUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'> | null;
};

@Injectable()
export class PrismaLeadRepository implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLeadData, tx?: LeadTransactionClient): Promise<LeadRecord> {
    const db = tx ?? this.prisma;
    const lead = await db.lead.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        workspaceId: data.workspaceId,
        code: data.code ?? null,
        company: data.company,
        contactPerson: data.contactPerson ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        website: data.website ?? null,
        industry: data.industry ?? null,
        country: data.country ?? null,
        source: data.source ?? 'OTHER',
        assignedToUserId: data.assignedToUserId ?? null,
        status: data.status ?? 'NEW',
        leadScore: data.leadScore ?? null,
        priority: data.priority ?? 'MEDIUM',
        expectedDealSize:
          data.expectedDealSize === undefined || data.expectedDealSize === null
            ? null
            : new Prisma.Decimal(data.expectedDealSize),
        notes: data.notes ?? null,
        need: data.need ?? null,
        authority: data.authority ?? null,
        budgetNotes: data.budgetNotes ?? null,
        timeline: data.timeline ?? null,
        painPoints: data.painPoints ?? null,
        decisionMaker: data.decisionMaker ?? null,
        competitor: data.competitor ?? null,
        qualificationNotes: data.qualificationNotes ?? null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdByUserId: data.createdByUserId ?? null,
        updatedByUserId: data.updatedByUserId ?? null,
      },
      include: leadInclude,
    });

    return toLeadRecord(lead);
  }

  async update(
    scope: LeadScope,
    id: string,
    data: UpdateLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null> {
    const db = tx ?? this.prisma;
    const { expectedDealSize, ...rest } = data;

    const result = await db.lead.updateMany({
      where: activeLeadWhere(scope, id),
      data: {
        ...rest,
        ...(expectedDealSize !== undefined
          ? {
              expectedDealSize:
                expectedDealSize === null ? null : new Prisma.Decimal(expectedDealSize),
            }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id);
  }

  async findById(
    scope: LeadScope,
    id: string,
    options?: FindLeadByIdOptions,
  ): Promise<LeadRecord | null> {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        ...(options?.includeArchived ? {} : { deletedAt: null }),
      },
      include: leadInclude,
    });

    return lead ? toLeadRecord(lead) : null;
  }

  async list(params: ListLeadsParams): Promise<ListLeadsResult> {
    const {
      scope,
      skip = 0,
      take = 25,
      q,
      status,
      source,
      assignedToUserId,
      priority,
      industry,
      country,
      includeArchived = false,
      archivedOnly = false,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = params;

    const search = q?.trim();

    const where: Prisma.LeadWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      ...(archivedOnly ? { deletedAt: { not: null } } : includeArchived ? {} : { deletedAt: null }),
      ...(status !== undefined ? { status } : {}),
      ...(source !== undefined ? { source } : {}),
      ...(assignedToUserId !== undefined ? { assignedToUserId } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(industry !== undefined ? { industry: { equals: industry, mode: 'insensitive' } } : {}),
      ...(country !== undefined ? { country: { equals: country, mode: 'insensitive' } } : {}),
      ...(search && search.length > 0
        ? {
            OR: [
              { company: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = buildOrderBy(sortBy, sortOrder);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        include: leadInclude,
        orderBy,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      items: items.map(toLeadRecord),
      total,
    };
  }

  async archive(
    scope: LeadScope,
    id: string,
    data: ArchiveLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.lead.updateMany({
      where: activeLeadWhere(scope, id),
      data: {
        status: data.status,
        deletedAt: data.deletedAt,
        deletedByUserId: data.deletedByUserId,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id);
  }

  async restore(
    scope: LeadScope,
    id: string,
    data: RestoreLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.lead.updateMany({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        OR: [{ deletedAt: { not: null } }, { status: 'ARCHIVED' }],
      },
      data: {
        status: data.status,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id);
  }

  async convert(
    scope: LeadScope,
    id: string,
    data: ConvertLeadData,
    tx?: LeadTransactionClient,
  ): Promise<LeadRecord | null> {
    const db = tx ?? this.prisma;
    const result = await db.lead.updateMany({
      where: activeLeadWhere(scope, id),
      data: {
        status: data.status,
        convertedClientId: data.convertedClientId,
        convertedAt: data.convertedAt,
        updatedAt: data.updatedAt,
        updatedByUserId: data.updatedByUserId,
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findByIdWithClient(db, scope, id);
  }

  private async findByIdWithClient(
    db: LeadTransactionClient | PrismaService,
    scope: LeadScope,
    id: string,
  ): Promise<LeadRecord | null> {
    const lead = await db.lead.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      include: leadInclude,
    });

    return lead ? toLeadRecord(lead) : null;
  }
}

const leadInclude = {
  assignedToUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeLeadWhere(scope: LeadScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function buildOrderBy(
  sortBy: LeadListSortField,
  sortOrder: 'asc' | 'desc',
): Prisma.LeadOrderByWithRelationInput {
  switch (sortBy) {
    case 'company':
      return { company: sortOrder };
    case 'leadScore':
      return { leadScore: sortOrder };
    case 'priority':
      return { priority: sortOrder };
    case 'createdAt':
      return { createdAt: sortOrder };
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

function toLeadRecord(lead: LeadWithRelations): LeadRecord {
  return {
    id: lead.id,
    tenantId: lead.tenantId,
    workspaceId: lead.workspaceId,
    code: lead.code,
    company: lead.company,
    contactPerson: lead.contactPerson,
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    website: lead.website,
    industry: lead.industry,
    country: lead.country,
    source: lead.source,
    assignedToUserId: lead.assignedToUserId,
    assignedToDisplayName: lead.assignedToUser ? resolveUserDisplayName(lead.assignedToUser) : null,
    assignedToEmail: lead.assignedToUser?.email ?? null,
    status: lead.status,
    leadScore: lead.leadScore,
    priority: lead.priority,
    expectedDealSize: lead.expectedDealSize?.toNumber() ?? null,
    notes: lead.notes,
    need: lead.need,
    authority: lead.authority,
    budgetNotes: lead.budgetNotes,
    timeline: lead.timeline,
    painPoints: lead.painPoints,
    decisionMaker: lead.decisionMaker,
    competitor: lead.competitor,
    qualificationNotes: lead.qualificationNotes,
    convertedClientId: lead.convertedClientId,
    convertedAt: lead.convertedAt,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    createdByUserId: lead.createdByUserId,
    updatedByUserId: lead.updatedByUserId,
    deletedAt: lead.deletedAt,
    deletedByUserId: lead.deletedByUserId,
  };
}
