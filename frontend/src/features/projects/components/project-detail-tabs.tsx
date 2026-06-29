'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ProjectDetailTab = 'members' | 'milestones' | 'files';

interface ProjectDetailTabsProps {
  readonly members: ReactNode;
  readonly milestones: ReactNode;
  readonly files: ReactNode;
  readonly defaultTab?: ProjectDetailTab;
}

const TAB_LABELS: Record<ProjectDetailTab, string> = {
  members: 'Members',
  milestones: 'Milestones',
  files: 'Files',
};

export function ProjectDetailTabs({
  members,
  milestones,
  files,
  defaultTab = 'members',
}: ProjectDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(defaultTab);

  const tabContent: Record<ProjectDetailTab, ReactNode> = {
    members,
    milestones,
    files,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Project detail sections">
          {(Object.keys(TAB_LABELS) as ProjectDetailTab[]).map((tab) => (
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

      <div className="pt-6">{tabContent[activeTab]}</div>
    </div>
  );
}
