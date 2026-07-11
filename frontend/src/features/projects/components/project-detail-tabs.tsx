'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ProjectDetailTab =
  'overview' | 'members' | 'tasks' | 'finance' | 'notes' | 'documents' | 'activity';

interface ProjectDetailTabsProps {
  readonly overview: ReactNode;
  readonly members: ReactNode;
  readonly tasks: ReactNode;
  readonly finance: ReactNode;
  readonly notes: ReactNode;
  readonly documents: ReactNode;
  readonly activity: ReactNode;
  readonly defaultTab?: ProjectDetailTab;
  readonly activeTab?: ProjectDetailTab;
  readonly onTabChange?: (tab: ProjectDetailTab) => void;
}

const TAB_LABELS: Record<ProjectDetailTab, string> = {
  overview: 'Overview',
  members: 'Members',
  tasks: 'Tasks',
  finance: 'Finance',
  notes: 'Notes',
  documents: 'Documents',
  activity: 'Activity',
};

export function ProjectDetailTabs({
  overview,
  members,
  tasks,
  finance,
  notes,
  documents,
  activity,
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
    members,
    tasks,
    finance,
    notes,
    documents,
    activity,
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
