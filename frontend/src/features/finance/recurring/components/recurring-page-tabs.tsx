'use client';

import { cn } from '@/lib/utils';

export type RecurringPageTab = 'invoices' | 'expenses';

interface RecurringPageTabsProps {
  readonly activeTab: RecurringPageTab;
  readonly onTabChange: (tab: RecurringPageTab) => void;
}

const TAB_LABELS: Record<RecurringPageTab, string> = {
  invoices: 'Invoices',
  expenses: 'Expenses',
};

export function RecurringPageTabs({ activeTab, onTabChange }: RecurringPageTabsProps) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Recurring type">
        {(Object.keys(TAB_LABELS) as RecurringPageTab[]).map((tab) => (
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
