'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type InvoiceDetailTab = 'lineItems' | 'overview' | 'payments' | 'history';

interface InvoiceDetailTabsProps {
  readonly lineItems: ReactNode;
  readonly overview: ReactNode;
  readonly payments: ReactNode;
  readonly history: ReactNode;
  readonly defaultTab?: InvoiceDetailTab;
}

const TAB_LABELS: Record<InvoiceDetailTab, string> = {
  lineItems: 'Line Items',
  overview: 'Overview',
  payments: 'Payments',
  history: 'History',
};

export function InvoiceDetailTabs({
  lineItems,
  overview,
  payments,
  history,
  defaultTab = 'lineItems',
}: InvoiceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<InvoiceDetailTab>(defaultTab);

  const tabContent: Record<InvoiceDetailTab, ReactNode> = {
    lineItems,
    overview,
    payments,
    history,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Invoice detail sections">
          {(Object.keys(TAB_LABELS) as InvoiceDetailTab[]).map((tab) => (
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
