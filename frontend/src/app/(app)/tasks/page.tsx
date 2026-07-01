'use client';

import { CheckSquare, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { listProjectMilestones } from '@/features/projects/milestones/api/milestones.api';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { mapTaskRecordToListItem } from '@/features/tasks/api/task.mapper';
import {
  TaskFormDrawer,
  TaskListMobileCards,
  TaskListPagination,
  TaskListTable,
  TaskListToolbar,
} from '@/features/tasks/components';
import { TaskViewSwitcher } from '@/features/tasks/kanban/components/task-view-switcher';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import type {
  TaskListItem,
  TaskListPriorityFilter,
  TaskListStatusFilter,
} from '@/features/tasks/types';
import { resolveListTasksQuery } from '@/features/tasks/utils/list-tasks-query';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskListStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskListPriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { params: listParams, usesClientSideListProcessing } = resolveListTasksQuery(
    statusFilter,
    assigneeFilter,
    page,
    pageSize,
  );

  const { data, isLoading, isFetching, error, refetch } = useTasks(listParams);
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

  const uniqueProjectIds = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...new Set(data.items.map((task) => task.projectId))];
  }, [data]);

  const milestoneQueries = useQueries({
    queries: uniqueProjectIds.map((projectId) => ({
      queryKey: projectMilestonesQueryKeys.list(projectId),
      queryFn: () => listProjectMilestones(projectId),
      enabled: projectId.length > 0,
    })),
  });

  const milestoneNamesById = useMemo(() => {
    const map = new Map<string, string>();

    for (const query of milestoneQueries) {
      if (!query.data) {
        continue;
      }

      for (const milestone of query.data.milestones) {
        map.set(milestone.id, milestone.name);
      }
    }

    return map;
  }, [milestoneQueries]);

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

  const matchingTasks = useMemo((): TaskListItem[] => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return data.items
      .map((record) => mapTaskRecordToListItem(record, { projectNamesById, milestoneNamesById }))
      .filter((task) => {
        if (assigneeFilter === 'unassigned' && task.assigneeUserId !== null) {
          return false;
        }

        if (
          assigneeFilter !== 'all' &&
          assigneeFilter !== 'unassigned' &&
          task.assigneeUserId !== assigneeFilter
        ) {
          return false;
        }

        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
          return false;
        }

        if (query.length === 0) {
          return true;
        }

        return (
          task.title.toLowerCase().includes(query) ||
          task.projectName.toLowerCase().includes(query) ||
          task.milestoneName.toLowerCase().includes(query) ||
          task.assigneeName.toLowerCase().includes(query)
        );
      });
  }, [assigneeFilter, data, milestoneNamesById, priorityFilter, projectNamesById, search]);

  const filteredTasks = useMemo((): TaskListItem[] => {
    if (!usesClientSideListProcessing) {
      return matchingTasks;
    }

    const start = (page - 1) * pageSize;
    return matchingTasks.slice(start, start + pageSize);
  }, [matchingTasks, page, pageSize, usesClientSideListProcessing]);

  const totalItems = matchingTasks.length;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    assigneeFilter !== 'all';
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
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
    setPage(1);
  };

  const handleRefresh = (): void => {
    void refetch();
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Tasks"
        description="Track and manage delivery work items"
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
        <TaskListToolbar
          search={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          assigneeFilter={assigneeFilter}
          assigneeOptions={assigneeOptions}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onPriorityFilterChange={(value) => {
            setPriorityFilter(value);
            setPage(1);
          }}
          onAssigneeFilterChange={(value) => {
            setAssigneeFilter(value);
            setPage(1);
          }}
          onRefresh={handleRefresh}
        />

        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            action={
              <Button variant="outline" onClick={handleRefresh}>
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <LoadingState label="Loading tasks..." />
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={hasActiveFilters ? 'No tasks match your filters' : 'No tasks yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Create the first task to start tracking delivery work.'
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
          <>
            <TaskListMobileCards tasks={filteredTasks} onEditTask={openEditDrawer} />
            <div className="hidden md:block">
              <TaskListTable tasks={filteredTasks} onEditTask={openEditDrawer} />
            </div>
            <TaskListPagination
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={(nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}
