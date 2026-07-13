'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type DealDetailTab =
  | 'overview'
  | 'products'
  | 'timeline'
  | 'followUps'
  | 'comments'
  | 'documents'
  | 'tags'
  | 'proposal'
  | 'quote';

interface DealDetailTabsProps {
  readonly overview: ReactNode;
  readonly products: ReactNode;
  readonly timeline: ReactNode;
  readonly followUps: ReactNode;
  readonly comments: ReactNode;
  readonly documents: ReactNode;
  readonly tags: ReactNode;
  readonly proposal: ReactNode;
  readonly quote: ReactNode;
  readonly defaultTab?: DealDetailTab;
}

const TAB_LABELS: Record<DealDetailTab, string> = {
  overview: 'Overview',
  products: 'Products',
  timeline: 'Timeline',
  followUps: 'Follow-ups',
  comments: 'Comments',
  documents: 'Documents',
  tags: 'Tags',
  proposal: 'Proposal',
  quote: 'Quote',
};

const TAB_ORDER: readonly DealDetailTab[] = [
  'overview',
  'products',
  'timeline',
  'followUps',
  'comments',
  'documents',
  'tags',
  'proposal',
  'quote',
];

export function DealDetailTabs({
  overview,
  products,
  timeline,
  followUps,
  comments,
  documents,
  tags,
  proposal,
  quote,
  defaultTab = 'overview',
}: DealDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<DealDetailTab>(defaultTab);

  const tabContent: Record<DealDetailTab, ReactNode> = {
    overview,
    products,
    timeline,
    followUps,
    comments,
    documents,
    tags,
    proposal,
    quote,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Deal detail sections">
          {TAB_ORDER.map((tab) => (
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
