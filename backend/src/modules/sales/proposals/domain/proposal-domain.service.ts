import type { ProposalStatus } from '@prisma/client';
import {
  type DealRepository,
  type DealScope,
} from '../../deals/repositories/deal.repository.interface';
import {
  type QuoteRepository,
  type QuoteScope,
} from '../../quotes/repositories/quote.repository.interface';
import type { ProposalRecord } from '../repositories/proposal.repository.interface';
import { PROPOSAL_DOMAIN_ERROR_CODES, ProposalDomainError } from './proposal-domain.errors';
import type {
  CreateProposalValidationInput,
  UpdateProposalValidationInput,
} from './proposal-domain.types';
import { normalizeProposalSections } from './proposal-sections';

const VALID_STATUSES: readonly ProposalStatus[] = [
  'DRAFT',
  'REVIEW',
  'SENT',
  'VIEWED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
];

export class ProposalDomainService {
  constructor(
    private readonly dealRepository: DealRepository,
    private readonly quoteRepository: QuoteRepository,
  ) {}

  validateCreate(input: CreateProposalValidationInput): void {
    this.assertTitleRequired(input.title);

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  validateUpdate(proposal: ProposalRecord, input: UpdateProposalValidationInput): void {
    this.assertProposalIsActive(proposal);

    if (input.title !== undefined) {
      this.assertTitleRequired(input.title);
    }

    if (input.status !== undefined) {
      this.assertStatusValid(input.status);
    }
  }

  async validateDeal(scope: DealScope, dealId: string): Promise<void> {
    const deal = await this.dealRepository.findById(scope, dealId);

    if (deal === null) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.DEAL_NOT_FOUND,
        'Deal was not found.',
      );
    }

    if (deal.deletedAt !== null) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.DEAL_ARCHIVED,
        'Deal is archived and cannot be modified.',
      );
    }
  }

  async validateQuote(scope: QuoteScope, quoteId: string, dealId: string): Promise<void> {
    const quote = await this.quoteRepository.findById(scope, quoteId);

    if (quote === null) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.QUOTE_NOT_FOUND,
        'Quote was not found.',
      );
    }

    if (quote.dealId !== dealId) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.QUOTE_DEAL_MISMATCH,
        'Quote does not belong to the selected deal.',
      );
    }
  }

  normalizeTitle(title: string): string {
    return title.trim();
  }

  normalizeSections(sections: unknown): ReturnType<typeof normalizeProposalSections> {
    return normalizeProposalSections(sections);
  }

  private assertTitleRequired(title: string): void {
    if (title.trim().length === 0) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.TITLE_REQUIRED,
        'Proposal title is required.',
      );
    }
  }

  private assertStatusValid(status: ProposalStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.INVALID_STATUS,
        'Proposal status is invalid.',
      );
    }
  }

  private assertProposalIsActive(proposal: ProposalRecord): void {
    if (proposal.deletedAt !== null) {
      throw new ProposalDomainError(
        PROPOSAL_DOMAIN_ERROR_CODES.PROPOSAL_ARCHIVED,
        'Proposal is archived and cannot be modified.',
      );
    }
  }
}
