'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PurchaseBillDetailTab = 'lineItems' | 'overview' | 'payments';

interface PurchaseBillDetailTabsProps {
  readonly lineItems: ReactNode;
  readonly overview: ReactNode;
  readonly payments: ReactNode;
  readonly defaultTab?: PurchaseBillDetailTab;
}

const TAB_LABELS: Record<PurchaseBillDetailTab, string> = {
  lineItems: 'Line Items',
  overview: 'Overview',
  payments: 'Payments',
};

export function PurchaseBillDetailTabs({
  lineItems,
  overview,
  payments,
  defaultTab = 'lineItems',
}: PurchaseBillDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<PurchaseBillDetailTab>(defaultTab);

  const tabContent: Record<PurchaseBillDetailTab, ReactNode> = {
    lineItems,
    overview,
    payments,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav
          className="-mb-px flex gap-6 overflow-x-auto"
          aria-label="Purchase bill detail sections"
        >
          {(Object.keys(TAB_LABELS) as PurchaseBillDetailTab[]).map((tab) => (
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
