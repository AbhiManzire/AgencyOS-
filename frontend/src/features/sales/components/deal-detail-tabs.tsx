'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DealDetailTab = 'followUps' | 'comments' | 'proposal' | 'quote' | 'documents';

interface DealDetailTabsProps {
  readonly followUps: ReactNode;
  readonly comments: ReactNode;
  readonly proposal: ReactNode;
  readonly quote: ReactNode;
  readonly documents: ReactNode;
  readonly defaultTab?: DealDetailTab;
}

const TAB_LABELS: Record<DealDetailTab, string> = {
  followUps: 'Follow-ups',
  comments: 'Comments',
  proposal: 'Proposal',
  quote: 'Quote',
  documents: 'Documents',
};

export function DealDetailTabs({
  followUps,
  comments,
  proposal,
  quote,
  documents,
  defaultTab = 'followUps',
}: DealDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DealDetailTab>(defaultTab);

  const tabContent: Record<DealDetailTab, ReactNode> = {
    followUps,
    comments,
    proposal,
    quote,
    documents,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Deal detail sections">
          {(Object.keys(TAB_LABELS) as DealDetailTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => {
                setActiveTab(tab);
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-6">{tabContent[activeTab]}</div>
    </div>
  );
}
