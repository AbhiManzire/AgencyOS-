'use client';

import { cn } from '@/lib/utils';

export type IntegrationsPageTab = 'marketplace' | 'connections' | 'sync' | 'logs';

interface IntegrationsPageTabsProps {
  readonly activeTab: IntegrationsPageTab;
  readonly onTabChange: (tab: IntegrationsPageTab) => void;
}

const TAB_LABELS: Record<IntegrationsPageTab, string> = {
  marketplace: 'Marketplace',
  connections: 'Connections',
  sync: 'Sync history',
  logs: 'Logs',
};

export function IntegrationsPageTabs({ activeTab, onTabChange }: IntegrationsPageTabsProps) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Integration sections">
        {(Object.keys(TAB_LABELS) as IntegrationsPageTab[]).map((tab) => (
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
              onTabChange(tab);
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>
    </div>
  );
}
