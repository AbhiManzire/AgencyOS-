'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ProjectDetailTab =
  | 'overview'
  | 'milestones'
  | 'tasks'
  | 'team'
  | 'files'
  | 'timeline'
  | 'comments'
  | 'invoices'
  | 'payments'
  | 'client'
  | 'activities';

interface ProjectDetailTabsProps {
  readonly overview: ReactNode;
  readonly milestones: ReactNode;
  readonly tasks: ReactNode;
  readonly team: ReactNode;
  readonly files: ReactNode;
  readonly timeline: ReactNode;
  readonly comments: ReactNode;
  readonly invoices: ReactNode;
  readonly payments: ReactNode;
  readonly client: ReactNode;
  readonly activities: ReactNode;
  readonly defaultTab?: ProjectDetailTab;
  readonly activeTab?: ProjectDetailTab;
  readonly onTabChange?: (tab: ProjectDetailTab) => void;
}

const TAB_LABELS: Record<ProjectDetailTab, string> = {
  overview: 'Overview',
  milestones: 'Milestones',
  tasks: 'Tasks',
  team: 'Team',
  files: 'Files',
  timeline: 'Timeline',
  comments: 'Comments',
  invoices: 'Invoices',
  payments: 'Payments',
  client: 'Client',
  activities: 'Activities',
};

export function ProjectDetailTabs({
  overview,
  milestones,
  tasks,
  team,
  files,
  timeline,
  comments,
  invoices,
  payments,
  client,
  activities,
  defaultTab = 'overview',
  activeTab: controlledTab,
  onTabChange,
}: ProjectDetailTabsProps) {
  const [uncontrolledTab, setUncontrolledTab] = useState<ProjectDetailTab>(defaultTab);
  const activeTab = controlledTab ?? uncontrolledTab;

  const setActiveTab = (tab: ProjectDetailTab): void => {
    onTabChange?.(tab);
    if (controlledTab === undefined) {
      setUncontrolledTab(tab);
    }
  };

  const tabContent: Record<ProjectDetailTab, ReactNode> = {
    overview,
    milestones,
    tasks,
    team,
    files,
    timeline,
    comments,
    invoices,
    payments,
    client,
    activities,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Project detail sections">
          {(Object.keys(TAB_LABELS) as ProjectDetailTab[]).map((tab) => (
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
