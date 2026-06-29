import { Injectable } from '@nestjs/common';
import { type Deal, type Proposal, type Quote } from '@prisma/client';
import { normalizeProposalSections } from '../domain/proposal-sections';
import type {
  CreateProposalData,
  CreateProposalVersionData,
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
    const { sections, ...rest } = data;

    const result = await this.prisma.proposal.updateMany({
      where: activeProposalWhere(scope, id),
      data: {
        ...rest,
        ...(sections !== undefined ? { sections } : {}),
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
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
    createdByUserId: proposal.createdByUserId,
    updatedByUserId: proposal.updatedByUserId,
    deletedAt: proposal.deletedAt,
    deletedByUserId: proposal.deletedByUserId,
  };
}
