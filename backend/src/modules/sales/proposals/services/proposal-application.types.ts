import type { ProposalStatus } from '@prisma/client';
import type { ProposalSections } from '../domain/proposal-sections';
import type { ProposalRecord, ProposalScope } from '../repositories/proposal.repository.interface';

export type { ProposalRecord, ProposalScope, ProposalSections };

export interface ProposalApplicationContext {
  readonly actorUserId: string;
}

export interface CreateProposalCommand {
  readonly dealId: string;
  readonly quoteId?: string | null;
  readonly title: string;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
}

export interface UpdateProposalCommand {
  readonly quoteId?: string | null;
  readonly title?: string;
  readonly status?: ProposalStatus;
  readonly sections?: Partial<ProposalSections>;
  readonly incrementVersion?: boolean;
}
