'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TaskDetailTab =
  'subtasks' | 'dependencies' | 'tags' | 'files' | 'comments' | 'timeEntries';

interface TaskDetailTabsProps {
  readonly subtasks: ReactNode;
  readonly dependencies: ReactNode;
  readonly tags: ReactNode;
  readonly files: ReactNode;
  readonly comments: ReactNode;
  readonly timeEntries: ReactNode;
  readonly defaultTab?: TaskDetailTab;
}

const TAB_LABELS: Record<TaskDetailTab, string> = {
  subtasks: 'Subtasks',
  dependencies: 'Dependencies',
  tags: 'Tags',
  files: 'Files',
  comments: 'Comments',
  timeEntries: 'Time Entries',
};

export function TaskDetailTabs({
  subtasks,
  dependencies,
  tags,
  files,
  comments,
  timeEntries,
  defaultTab = 'subtasks',
}: TaskDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TaskDetailTab>(defaultTab);

  const tabContent: Record<TaskDetailTab, ReactNode> = {
    subtasks,
    dependencies,
    tags,
    files,
    comments,
    timeEntries,
  };

  return (
    <div className="mt-6">
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Task detail sections">
          {(Object.keys(TAB_LABELS) as TaskDetailTab[]).map((tab) => (
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
