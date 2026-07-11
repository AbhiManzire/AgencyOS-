'use client';

import { CheckSquare, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { useWorkspaceOwners } from '@/features/clients/hooks/use-workspace-owners';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { listProjectMilestones } from '@/features/projects/milestones/api/milestones.api';
import { projectMilestonesQueryKeys } from '@/features/projects/milestones/hooks/project-milestones-query-keys';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { mapTaskRecordToListItem } from '@/features/tasks/api/task.mapper';
import { ArchiveTaskDialog } from '@/features/tasks/components/archive-task-dialog';
import { TaskFormDrawer } from '@/features/tasks/components/task-form-drawer';
import { TaskListMobileCards, TaskListTable } from '@/features/tasks/components/task-list-table';
import { TaskListPagination } from '@/features/tasks/components/task-list-pagination';
import { TaskListToolbar } from '@/features/tasks/components/task-list-toolbar';
import { TaskViewSwitcher } from '@/features/tasks/kanban/components/task-view-switcher';
import { useArchiveTask } from '@/features/tasks/hooks/use-archive-task';
import { useRestoreTask } from '@/features/tasks/hooks/use-restore-task';
import { useTasks } from '@/features/tasks/hooks/use-tasks';
import type {
  SortDirection,
  TaskListArchivedFilter,
  TaskListDueFilter,
  TaskListItem,
  TaskListPriorityFilter,
  TaskListStatusFilter,
  TaskSortField,
} from '@/features/tasks/types';
import { resolveListTasksQuery } from '@/features/tasks/utils/list-tasks-query';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function TasksPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskListStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskListPriorityFilter>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [reporterFilter, setReporterFilter] = useState('all');
  const [archivedFilter, setArchivedFilter] = useState<TaskListArchivedFilter>('active');
  const [dueFilter, setDueFilter] = useState<TaskListDueFilter>('all');
  const [sortField, setSortField] = useState<TaskSortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TaskListItem | null>(null);

  const { params: listParams } = resolveListTasksQuery({
    statusFilter,
    priorityFilter,
    archivedFilter,
    dueFilter,
    page,
    pageSize,
    search,
    projectId: projectFilter !== 'all' ? projectFilter : undefined,
    assigneeUserId: assigneeFilter !== 'all' ? assigneeFilter : undefined,
    reporterUserId: reporterFilter !== 'all' ? reporterFilter : undefined,
    sortField,
    sortDirection,
  });

  const { data, isLoading, isFetching, error, refetch } = useTasks(listParams);
  const { data: projectsData } = useProjects({ take: 100 });
  const { data: owners = [] } = useWorkspaceOwners();
  const { mutateAsync: archiveTask, isPending: isArchiving } = useArchiveTask();
  const { mutateAsync: restoreTaskMutation } = useRestoreTask();

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
      [...projectNamesById.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((left, right) =>
          left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
        ),
    [projectNamesById],
  );

  const projectIdsWithMilestones = useMemo(() => {
    if (!data) {
      return [];
    }

    const ids = new Set<string>();
    for (const task of data.items) {
      if (task.milestoneId) {
        ids.add(task.projectId);
      }
    }
    return [...ids];
  }, [data]);

  const milestoneQueries = useQueries({
    queries: projectIdsWithMilestones.map((projectId) => ({
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

  const ownerOptions = useMemo(
    () =>
      owners
        .map((owner) => ({
          id: owner.id,
          label: owner.displayName || owner.email || owner.id,
        }))
        .sort((left, right) =>
          left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
        ),
    [owners],
  );

  const tasks = useMemo((): TaskListItem[] => {
    if (!data) {
      return [];
    }

    return data.items.map((record) =>
      mapTaskRecordToListItem(record, { projectNamesById, milestoneNamesById }),
    );
  }, [data, milestoneNamesById, projectNamesById]);

  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    projectFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    reporterFilter !== 'all' ||
    archivedFilter !== 'active' ||
    dueFilter !== 'all';
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
    setProjectFilter('all');
    setAssigneeFilter('all');
    setReporterFilter('all');
    setArchivedFilter('active');
    setDueFilter('all');
    setSortField('updatedAt');
    setSortDirection('desc');
    setPage(1);
  };

  const handleRefresh = (): void => {
    void refetch();
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (archiveTarget === null) {
      return;
    }

    try {
      await archiveTask(archiveTarget.id);
      showToast('Task archived');
      setArchiveTarget(null);
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (taskId: string): Promise<void> => {
    try {
      await restoreTaskMutation(taskId);
      showToast('Task restored');
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
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

      <ArchiveTaskDialog
        open={archiveTarget !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveTarget(null);
        }}
        onConfirm={() => {
          void handleArchiveConfirm();
        }}
      />

      <div className="space-y-4">
        <TaskListToolbar
          search={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          projectFilter={projectFilter}
          assigneeFilter={assigneeFilter}
          reporterFilter={reporterFilter}
          archivedFilter={archivedFilter}
          dueFilter={dueFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          projectOptions={projectOptions}
          assigneeOptions={ownerOptions}
          reporterOptions={ownerOptions}
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
          onProjectFilterChange={(value) => {
            setProjectFilter(value);
            setPage(1);
          }}
          onAssigneeFilterChange={(value) => {
            setAssigneeFilter(value);
            setPage(1);
          }}
          onReporterFilterChange={(value) => {
            setReporterFilter(value);
            setPage(1);
          }}
          onArchivedFilterChange={(value) => {
            setArchivedFilter(value);
            setPage(1);
          }}
          onDueFilterChange={(value) => {
            setDueFilter(value);
            setPage(1);
          }}
          onSortFieldChange={(value) => {
            setSortField(value);
            setPage(1);
          }}
          onSortDirectionChange={(value) => {
            setSortDirection(value);
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
        ) : tasks.length === 0 ? (
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
            <TaskListMobileCards
              tasks={tasks}
              onEditTask={openEditDrawer}
              onArchiveTask={(taskId) => {
                const task = tasks.find((item) => item.id === taskId) ?? null;
                setArchiveTarget(task);
              }}
              onRestoreTask={(taskId) => {
                void handleRestore(taskId);
              }}
            />
            <div className="hidden md:block">
              <TaskListTable
                tasks={tasks}
                onEditTask={openEditDrawer}
                onArchiveTask={(taskId) => {
                  const task = tasks.find((item) => item.id === taskId) ?? null;
                  setArchiveTarget(task);
                }}
                onRestoreTask={(taskId) => {
                  void handleRestore(taskId);
                }}
              />
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
