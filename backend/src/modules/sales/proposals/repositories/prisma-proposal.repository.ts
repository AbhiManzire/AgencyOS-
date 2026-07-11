import { Injectable } from '@nestjs/common';
import { Prisma, type Deal, type Proposal, type Quote } from '@prisma/client';
import { normalizeProposalSections } from '../domain/proposal-sections';
import type {
  CreateProposalData,
  CreateProposalVersionData,
  ListProposalsParams,
  ListProposalsResult,
  ProposalRecord,
  ProposalRepository,
  ProposalScope,
  ProposalVersionRepository,
  UpdateProposalData,
} from './proposal.repository.interface';
import { PrismaService } from '../../../prisma/prisma.service';

type ProposalWithRelations = Proposal & {
  deal: Pick<Deal, 'title'>;
  quote: Pick<Quote, 'title'> | null;
};

@Injectable()
export class PrismaProposalRepository implements ProposalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProposalData): Promise<ProposalRecord> {
    const proposal = await this.prisma.proposal.create({
      data: {
        ...data,
        sections: data.sections,
        amount:
          data.amount === undefined || data.amount === null
            ? null
            : new Prisma.Decimal(data.amount),
        tax: data.tax === undefined || data.tax === null ? null : new Prisma.Decimal(data.tax),
        discount:
          data.discount === undefined || data.discount === null
            ? null
            : new Prisma.Decimal(data.discount),
        validUntil: data.validUntil ?? null,
      },
      include: proposalInclude,
    });

    return toProposalRecord(proposal);
  }

  async update(
    scope: ProposalScope,
    id: string,
    data: UpdateProposalData,
  ): Promise<ProposalRecord | null> {
    const { sections, amount, tax, discount, ...rest } = data;

    const result = await this.prisma.proposal.updateMany({
      where: activeProposalWhere(scope, id),
      data: {
        ...rest,
        ...(sections !== undefined ? { sections } : {}),
        ...(amount !== undefined
          ? { amount: amount === null ? null : new Prisma.Decimal(amount) }
          : {}),
        ...(tax !== undefined ? { tax: tax === null ? null : new Prisma.Decimal(tax) } : {}),
        ...(discount !== undefined
          ? { discount: discount === null ? null : new Prisma.Decimal(discount) }
          : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async findById(scope: ProposalScope, id: string): Promise<ProposalRecord | null> {
    const proposal = await this.prisma.proposal.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      include: proposalInclude,
    });

    return proposal ? toProposalRecord(proposal) : null;
  }

  async list(params: ListProposalsParams): Promise<ListProposalsResult> {
    const { scope, skip = 0, take = 25, dealId, status } = params;

    const where: Prisma.ProposalWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      ...(dealId !== undefined ? { dealId } : {}),
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.proposal.findMany({
        where,
        skip,
        take,
        include: proposalInclude,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.proposal.count({ where }),
    ]);

    return {
      items: items.map(toProposalRecord),
      total,
    };
  }
}

@Injectable()
export class PrismaProposalVersionRepository implements ProposalVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateProposalVersionData): Promise<void> {
    await this.prisma.proposalVersion.create({
      data: {
        ...data,
        sections: data.sections,
      },
    });
  }
}

const proposalInclude = {
  deal: { select: { title: true } },
  quote: { select: { title: true } },
} as const;

function activeProposalWhere(scope: ProposalScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function toProposalRecord(proposal: ProposalWithRelations): ProposalRecord {
  return {
    id: proposal.id,
    tenantId: proposal.tenantId,
    workspaceId: proposal.workspaceId,
    dealId: proposal.dealId,
    dealTitle: proposal.deal.title,
    quoteId: proposal.quoteId,
    quoteTitle: proposal.quote?.title ?? null,
    title: proposal.title,
    version: proposal.version,
    status: proposal.status,
    sections: normalizeProposalSections(proposal.sections),
    amount: proposal.amount?.toNumber() ?? null,
    tax: proposal.tax?.toNumber() ?? null,
    discount: proposal.discount?.toNumber() ?? null,
    validUntil: proposal.validUntil,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    createdByUserId: proposal.createdByUserId,
    updatedByUserId: proposal.updatedByUserId,
    deletedAt: proposal.deletedAt,
    deletedByUserId: proposal.deletedByUserId,
  };
}
