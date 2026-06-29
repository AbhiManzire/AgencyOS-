'use client';

import { Columns3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { TaskFormDrawer } from '@/features/tasks/components';
import { TaskKanbanBoard } from '@/features/tasks/kanban/components/task-kanban-board';
import { TaskKanbanToolbar } from '@/features/tasks/kanban/components/task-kanban-toolbar';
import { TaskViewSwitcher } from '@/features/tasks/kanban/components/task-view-switcher';
import { KANBAN_LIST_PARAMS } from '@/features/tasks/kanban/kanban.constants';
import {
  isKanbanBoardTask,
  mapTaskRecordToKanbanCard,
} from '@/features/tasks/kanban/kanban.mapper';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function TaskKanbanPage() {
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      ...KANBAN_LIST_PARAMS,
      ...(projectFilter !== 'all' ? { projectId: projectFilter } : {}),
      ...(assigneeFilter !== 'all' && assigneeFilter !== 'unassigned'
        ? { assigneeUserId: assigneeFilter }
        : {}),
    }),
    [assigneeFilter, projectFilter],
  );

  const { data, isLoading, error, refetch } = useTasks(listParams);
  const { data: projectsData } = useProjects({ take: 100 });

  const activeTask = useMemo(
    () => data?.items.find((task) => task.id === activeTaskId),
    [activeTaskId, data?.items],
  );

  const projectNamesById = useMemo(() => {
    const map = new Map<string, string>();
    if (!projectsData) {
      return map;
    }

    for (const project of projectsData.items) {
      map.set(project.id, mapProjectRecordToListItem(project).name);
    }

    return map;
  }, [projectsData]);

  const projectOptions = useMemo(
    () =>
      projectsData?.items.map((project) => ({
        id: project.id,
        name: mapProjectRecordToListItem(project).name,
      })) ?? [],
    [projectsData],
  );

  const assigneeOptions = useMemo(() => {
    if (!data) {
      return [];
    }

    const options = new Map<string, string>();

    for (const task of data.items) {
      if (task.assigneeUserId === null) {
        continue;
      }

      const label = task.assigneeDisplayName ?? task.assigneeEmail ?? task.assigneeUserId;
      options.set(task.assigneeUserId, label);
    }

    return [...options.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) =>
        left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
      );
  }, [data]);

  const kanbanTasks = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return data.items
      .filter(isKanbanBoardTask)
      .map((record) => mapTaskRecordToKanbanCard(record, { projectNamesById }))
      .filter((task) => {
        if (assigneeFilter === 'unassigned' && task.assigneeUserId !== null) {
          return false;
        }

        if (query.length === 0) {
          return true;
        }

        return (
          task.title.toLowerCase().includes(query) ||
          task.projectName.toLowerCase().includes(query) ||
          task.assigneeName.toLowerCase().includes(query)
        );
      });
  }, [assigneeFilter, data, projectNamesById, search]);

  const hasActiveFilters =
    search.trim().length > 0 || projectFilter !== 'all' || assigneeFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const openCreateDrawer = (): void => {
    setDrawerMode('create');
    setActiveTaskId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (taskId: string): void => {
    setDrawerMode('edit');
    setActiveTaskId(taskId);
    setDrawerOpen(true);
  };

  const clearFilters = (): void => {
    setSearch('');
    setProjectFilter('all');
    setAssigneeFilter('all');
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Tasks"
        description="Kanban view of delivery work items"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <TaskViewSwitcher />
            <Can permission="tasks.create">
              <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                <Plus className="size-4" />
                New Task
              </Button>
            </Can>
          </div>
        }
      />

      <TaskFormDrawer
        open={drawerOpen}
        mode={drawerMode}
        task={activeTask}
        onOpenChange={setDrawerOpen}
      />

      <div className="space-y-4">
        <TaskKanbanToolbar
          search={search}
          projectFilter={projectFilter}
          assigneeFilter={assigneeFilter}
          projectOptions={projectOptions}
          assigneeOptions={assigneeOptions}
          onSearchChange={setSearch}
          onProjectFilterChange={setProjectFilter}
          onAssigneeFilterChange={setAssigneeFilter}
        />

        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading board..." />
        ) : kanbanTasks.length === 0 ? (
          <EmptyState
            icon={Columns3}
            title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks on the board'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Create a task or move work items onto the board.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Can permission="tasks.create">
                  <Button type="button" className="gap-2" onClick={openCreateDrawer}>
                    <Plus className="size-4" />
                    New Task
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <TaskKanbanBoard
            tasks={kanbanTasks}
            listParams={listParams}
            onOpenTask={openEditDrawer}
          />
        )}
      </div>
    </PageContainer>
  );
}
