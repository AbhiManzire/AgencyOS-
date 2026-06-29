'use client';

import { cn } from '@/lib/utils';
import {
  PROPOSAL_SECTION_KEYS,
  PROPOSAL_SECTION_LABELS,
  type ProposalSectionKey,
} from '@/features/sales/proposals/proposal-sections';

interface SectionListProps {
  readonly activeSection: ProposalSectionKey;
  readonly onSelectSection: (section: ProposalSectionKey) => void;
}

export function SectionList({ activeSection, onSelectSection }: SectionListProps) {
  return (
    <nav aria-label="Proposal sections" className="space-y-1">
      {PROPOSAL_SECTION_KEYS.map((section) => (
        <button
          key={section}
          type="button"
          className={cn(
            'flex w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
            activeSection === section
              ? 'bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
          aria-current={activeSection === section ? 'page' : undefined}
          onClick={() => {
            onSelectSection(section);
          }}
        >
          {PROPOSAL_SECTION_LABELS[section]}
        </button>
      ))}
    </nav>
  );
}
