'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ClientDetailTab =
  | 'overview'
  | 'contacts'
  | 'deals'
  | 'projects'
  | 'invoices'
  | 'payments'
  | 'activities'
  | 'documents'
  | 'notes'
  | 'renewals'
  | 'timeline';

interface ClientDetailTabsProps {
  readonly overview: ReactNode;
  readonly contacts: ReactNode;
  readonly deals: ReactNode;
  readonly projects: ReactNode;
  readonly invoices: ReactNode;
  readonly payments: ReactNode;
  readonly activities: ReactNode;
  readonly documents: ReactNode;
  readonly notes: ReactNode;
  readonly renewals: ReactNode;
  readonly timeline: ReactNode;
  readonly defaultTab?: ClientDetailTab;
}

const TAB_LABELS: Record<ClientDetailTab, string> = {
  overview: 'Overview',
  contacts: 'Contacts',
  deals: 'Deals',
  projects: 'Projects',
  invoices: 'Invoices',
  payments: 'Payments',
  activities: 'Activities',
  documents: 'Documents',
  notes: 'Notes',
  renewals: 'Renewals',
  timeline: 'Timeline',
};

const TAB_ORDER: readonly ClientDetailTab[] = [
  'overview',
  'contacts',
  'deals',
  'projects',
  'invoices',
  'payments',
  'activities',
  'documents',
  'notes',
  'renewals',
  'timeline',
];

export function ClientDetailTabs({
  overview,
  contacts,
  deals,
  projects,
  invoices,
  payments,
  activities,
  documents,
  notes,
  renewals,
  timeline,
  defaultTab = 'overview',
}: ClientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<ClientDetailTab>(defaultTab);

  const tabContent: Record<ClientDetailTab, ReactNode> = {
    overview,
    contacts,
    deals,
    projects,
    invoices,
    payments,
    activities,
    documents,
    notes,
    renewals,
    timeline,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Client detail sections">
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
