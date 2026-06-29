import type { ProposalStatus } from '@prisma/client';
import type { ProposalSections } from '../domain/proposal-sections';

export const PROPOSAL_REPOSITORY = Symbol('PROPOSAL_REPOSITORY');
export const PROPOSAL_VERSION_REPOSITORY = Symbol('PROPOSAL_VERSION_REPOSITORY');

export interface ProposalScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface ProposalRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly dealTitle: string;
  readonly quoteId: string | null;
  readonly quoteTitle: string | null;
  readonly title: string;
  readonly version: number;
  readonly status: ProposalStatus;
  readonly sections: ProposalSections;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateProposalData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly dealId: string;
  readonly quoteId?: string | null;
  readonly title: string;
  readonly version?: number;
  readonly status?: ProposalStatus;
  readonly sections: ProposalSections;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateProposalData {
  readonly quoteId?: string | null;
  readonly title?: string;
  readonly version?: number;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface ProposalRepository {
  create(data: CreateProposalData): Promise<ProposalRecord>;
  update(
    scope: ProposalScope,
    id: string,
    data: UpdateProposalData,
  ): Promise<ProposalRecord | null>;
  findById(scope: ProposalScope, id: string): Promise<ProposalRecord | null>;
}

export interface CreateProposalVersionData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly proposalId: string;
  readonly version: number;
  readonly title: string;
  readonly status: ProposalStatus;
  readonly sections: ProposalSections;
  readonly createdAt: Date;
  readonly createdByUserId?: string | null;
}

export interface ProposalVersionRepository {
  create(data: CreateProposalVersionData): Promise<void>;
}
