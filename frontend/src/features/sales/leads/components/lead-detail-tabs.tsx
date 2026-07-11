'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type LeadDetailTab = 'overview' | 'qualification' | 'notes' | 'activity' | 'documents';

interface LeadDetailTabsProps {
  readonly overview: ReactNode;
  readonly qualification: ReactNode;
  readonly notes: ReactNode;
  readonly activity: ReactNode;
  readonly documents: ReactNode;
  readonly defaultTab?: LeadDetailTab;
}

const TAB_LABELS: Record<LeadDetailTab, string> = {
  overview: 'Overview',
  qualification: 'Qualification',
  notes: 'Notes',
  activity: 'Activity',
  documents: 'Documents',
};

export function LeadDetailTabs({
  overview,
  qualification,
  notes,
  activity,
  documents,
  defaultTab = 'overview',
}: LeadDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<LeadDetailTab>(defaultTab);

  const tabContent: Record<LeadDetailTab, ReactNode> = {
    overview,
    qualification,
    notes,
    activity,
    documents,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Lead detail sections">
          {(Object.keys(TAB_LABELS) as LeadDetailTab[]).map((tab) => (
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
