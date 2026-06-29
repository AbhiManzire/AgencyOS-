export const PROPOSAL_SECTION_KEYS = [
  'cover',
  'about',
  'scope',
  'deliverables',
  'timeline',
  'pricing',
  'terms',
  'signature',
] as const;

export type ProposalSectionKey = (typeof PROPOSAL_SECTION_KEYS)[number];

export type ProposalSections = Record<ProposalSectionKey, string>;

export type ProposalStatus = 'DRAFT' | 'REVIEW' | 'SENT' | 'ACCEPTED' | 'DECLINED';

export const PROPOSAL_SECTION_LABELS: Record<ProposalSectionKey, string> = {
  cover: 'Cover',
  about: 'About',
  scope: 'Scope',
  deliverables: 'Deliverables',
  timeline: 'Timeline',
  pricing: 'Pricing',
  terms: 'Terms',
  signature: 'Signature',
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Review',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
};

export function createDefaultProposalSections(): ProposalSections {
  return {
    cover: '',
    about: '',
    scope: '',
    deliverables: '',
    timeline: '',
    pricing: '',
    terms: '',
    signature: '',
  };
}

export function normalizeProposalSections(input: unknown): ProposalSections {
  const defaults = createDefaultProposalSections();

  if (input === null || input === undefined || typeof input !== 'object' || Array.isArray(input)) {
    return defaults;
  }

  const record = input as Record<string, unknown>;

  return PROPOSAL_SECTION_KEYS.reduce<ProposalSections>((sections, key) => {
    const value = record[key];
    sections[key] = typeof value === 'string' ? value : '';
    return sections;
  }, defaults);
}

export function areProposalSectionsEqual(left: ProposalSections, right: ProposalSections): boolean {
  return PROPOSAL_SECTION_KEYS.every((key) => left[key] === right[key]);
}
