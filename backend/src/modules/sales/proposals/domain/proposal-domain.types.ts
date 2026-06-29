import type { ProposalStatus } from '@prisma/client';
import type { ProposalSections } from './proposal-sections';

export interface CreateProposalValidationInput {
  readonly title: string;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
}

export interface UpdateProposalValidationInput {
  readonly title?: string;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
}
