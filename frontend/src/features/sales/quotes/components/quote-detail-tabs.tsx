'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type QuoteDetailTab = 'lineItems' | 'overview';

interface QuoteDetailTabsProps {
  readonly lineItems: ReactNode;
  readonly overview: ReactNode;
  readonly defaultTab?: QuoteDetailTab;
}

const TAB_LABELS: Record<QuoteDetailTab, string> = {
  lineItems: 'Line Items',
  overview: 'Overview',
};

export function QuoteDetailTabs({
  lineItems,
  overview,
  defaultTab = 'lineItems',
}: QuoteDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<QuoteDetailTab>(defaultTab);

  const tabContent: Record<QuoteDetailTab, ReactNode> = {
    lineItems,
    overview,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Quote detail sections">
          {(Object.keys(TAB_LABELS) as QuoteDetailTab[]).map((tab) => (
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
