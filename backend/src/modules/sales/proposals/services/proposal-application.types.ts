import type { ProposalStatus } from '@prisma/client';
import type { ProposalSections } from '../domain/proposal-sections';
import type {
  ListProposalsResult,
  ProposalRecord,
  ProposalScope,
} from '../repositories/proposal.repository.interface';

export type { ListProposalsResult, ProposalRecord, ProposalScope, ProposalSections };

export interface ProposalApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProposalCommand {
  readonly dealId: string;
  readonly quoteId?: string | null;
  readonly title: string;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
  readonly amount?: number | null;
  readonly tax?: number | null;
  readonly discount?: number | null;
  readonly validUntil?: Date | null;
}

export interface UpdateProposalCommand {
  readonly quoteId?: string | null;
  readonly title?: string;
  readonly status?: ProposalStatus;
  readonly sections?: Partial<ProposalSections>;
  readonly incrementVersion?: boolean;
  readonly amount?: number | null;
  readonly tax?: number | null;
  readonly discount?: number | null;
  readonly validUntil?: Date | null;
}

export interface ListProposalsQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly dealId?: string;
  readonly status?: ProposalStatus;
}
