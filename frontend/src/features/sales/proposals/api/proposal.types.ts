import type {
  ProposalSections,
  ProposalStatus,
} from '@/features/sales/proposals/proposal-sections';

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
  readonly amount: number | null;
  readonly tax: number | null;
  readonly discount: number | null;
  readonly validUntil: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface ListProposalsParams {
  readonly skip?: number;
  readonly take?: number;
  readonly dealId?: string;
  readonly status?: ProposalStatus;
}

export interface ListProposalsResult {
  readonly items: readonly ProposalRecord[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

export interface CreateProposalPayload {
  readonly dealId: string;
  readonly quoteId?: string | null;
  readonly title: string;
  readonly status?: ProposalStatus;
  readonly sections?: ProposalSections;
  readonly amount?: number | null;
  readonly tax?: number | null;
  readonly discount?: number | null;
  readonly validUntil?: string | null;
}

export interface UpdateProposalPayload {
  readonly quoteId?: string | null;
  readonly title?: string;
  readonly status?: ProposalStatus;
  readonly sections?: Partial<ProposalSections>;
  readonly incrementVersion?: boolean;
  readonly amount?: number | null;
  readonly tax?: number | null;
  readonly discount?: number | null;
  readonly validUntil?: string | null;
}
