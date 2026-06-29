'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ClientDetailTab = 'overview' | 'contacts';

interface ClientDetailTabsProps {
  readonly overview: ReactNode;
  readonly contacts: ReactNode;
  readonly defaultTab?: ClientDetailTab;
}

const TAB_LABELS: Record<ClientDetailTab, string> = {
  overview: 'Overview',
  contacts: 'Contacts',
};

export function ClientDetailTabs({
  overview,
  contacts,
  defaultTab = 'overview',
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<ClientDetailTab>(defaultTab);

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Client detail sections">
          {(Object.keys(TAB_LABELS) as ClientDetailTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'border-b-2 px-1 py-3 text-sm font-medium transition-colors',
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

      <div className="pt-6">{activeTab === 'overview' ? overview : contacts}</div>
    </div>
  );
}
