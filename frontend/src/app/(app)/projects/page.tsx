'use client';

import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import { mapClientRecordToListItem } from '@/features/clients/api/client.mapper';
import { useClients } from '@/features/clients/hooks/use-clients';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { ArchiveProjectDialog } from '@/features/projects/components/archive-project-dialog';
import { CreateProjectDrawer } from '@/features/projects/components/create-project-drawer';
import {
  ProjectListMobileCards,
  ProjectListTable,
} from '@/features/projects/components/project-list-table';
import { ProjectListPagination } from '@/features/projects/components/project-list-pagination';
import { ProjectListToolbar } from '@/features/projects/components/project-list-toolbar';
import { useArchiveProject } from '@/features/projects/hooks/use-archive-project';
import {
  useProjectDepartments,
  useProjectWorkspaceOwners,
} from '@/features/projects/hooks/use-project-meta';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useRestoreProject } from '@/features/projects/hooks/use-restore-project';
import type {
  ProjectListStatusFilter,
  ProjectPriority,
  ProjectSortField,
  SortDirection,
  WorkspaceOwnerOption,
} from '@/features/projects/types';
import { resolveListProjectsQuery } from '@/features/projects/utils/list-projects-query';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const SEARCH_DEBOUNCE_MS = 300;

export default function ProjectsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectListStatusFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [sortField, setSortField] = useState<ProjectSortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [archiveProjectId, setArchiveProjectId] = useState<string | null>(null);

  const { mutateAsync: archiveProject, isPending: isArchiving } = useArchiveProject();
  const { mutateAsync: restoreProject } = useRestoreProject();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const { params: listParams } = resolveListProjectsQuery({
    statusFilter,
    page,
    pageSize,
    search: debouncedSearch,
    projectManagerUserId: ownerFilter !== 'all' ? ownerFilter : undefined,
    clientId: clientFilter !== 'all' ? clientFilter : undefined,
    departmentId: departmentFilter !== 'all' ? departmentFilter : undefined,
    priority: priorityFilter,
    sortField,
    sortDirection,
  });

  const { data, isLoading, isFetching, error, refetch } = useProjects(listParams);
  const { data: clientsData } = useClients({ take: 100 });
  const { data: owners = [] } = useProjectWorkspaceOwners();
  const { data: departments = [] } = useProjectDepartments();

  const clientNamesById = useMemo(() => {
    const map = new Map<string, string>();
    if (!clientsData) {
      return map;
    }

    for (const client of clientsData.items) {
      map.set(client.id, mapClientRecordToListItem(client).displayName);
    }

    return map;
  }, [clientsData]);

  const ownersById = useMemo(() => {
    const map = new Map<string, WorkspaceOwnerOption>();
    for (const owner of owners) {
      map.set(owner.id, owner);
    }
    return map;
  }, [owners]);

  const ownerOptions = useMemo(
    () => owners.map((owner) => ({ id: owner.id, label: owner.displayName })),
    [owners],
  );

  const clientOptions = useMemo(() => {
    if (!clientsData) {
      return [];
    }

    return clientsData.items
      .filter((client) => client.deletedAt === null)
      .map((client) => ({ id: client.id, label: client.displayName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clientsData]);

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ id: department.id, label: department.name })),
    [departments],
  );

  const projects = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.items.map((record) =>
      mapProjectRecordToListItem(record, { clientNamesById, ownersById }),
    );
  }, [clientNamesById, data, ownersById]);

  const totalItems = data?.total ?? 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== 'all' ||
    ownerFilter !== 'all' ||
    clientFilter !== 'all' ||
    departmentFilter !== 'all' ||
    priorityFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const handleSortFieldChange = (field: ProjectSortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      setPage(1);
      return;
    }

    setSortField(field);
    setSortDirection('asc');
    setPage(1);
  };

  const clearFilters = (): void => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setOwnerFilter('all');
    setClientFilter('all');
    setDepartmentFilter('all');
    setPriorityFilter('all');
    setPage(1);
  };

  const handleRefresh = (): void => {
    void refetch();
  };

  const handleArchive = async (): Promise<void> => {
    if (archiveProjectId === null) {
      return;
    }

    try {
      await archiveProject(archiveProjectId);
      showToast('Project archived successfully');
      setArchiveProjectId(null);
      await refetch();
    } catch (archiveError) {
      showToast(extractApiErrorMessage(archiveError), 'error');
    }
  };

  const handleRestore = async (projectId: string): Promise<void> => {
    try {
      await restoreProject(projectId);
      showToast('Project restored successfully');
      await refetch();
    } catch (restoreError) {
      showToast(extractApiErrorMessage(restoreError), 'error');
    }
  };

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Projects"
        description="Track client delivery engagements"
        actions={
          <Can permission="projects.create">
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setCreateDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              New Project
            </Button>
          </Can>
        }
      />

      <CreateProjectDrawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen} />

      <CreateProjectDrawer
        open={editProjectId !== null}
        mode="edit"
        projectId={editProjectId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditProjectId(null);
          }
        }}
      />

      <ArchiveProjectDialog
        open={archiveProjectId !== null}
        isPending={isArchiving}
        onCancel={() => {
          setArchiveProjectId(null);
        }}
        onConfirm={() => {
          void handleArchive();
        }}
      />

      <div className="space-y-4">
        <ProjectListToolbar
          search={search}
          statusFilter={statusFilter}
          ownerFilter={ownerFilter}
          clientFilter={clientFilter}
          departmentFilter={departmentFilter}
          priorityFilter={priorityFilter}
          ownerOptions={ownerOptions}
          clientOptions={clientOptions}
          departmentOptions={departmentOptions}
          sortField={sortField}
          sortDirection={sortDirection}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={setSearch}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onOwnerFilterChange={(value) => {
            setOwnerFilter(value);
            setPage(1);
          }}
          onClientFilterChange={(value) => {
            setClientFilter(value);
            setPage(1);
          }}
          onDepartmentFilterChange={(value) => {
            setDepartmentFilter(value);
            setPage(1);
          }}
          onPriorityFilterChange={(value) => {
            setPriorityFilter(value);
            setPage(1);
          }}
          onSortFieldChange={(value) => {
            setSortField(value);
            setPage(1);
          }}
          onSortDirectionToggle={() => {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
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
          <LoadingState label="Loading projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            title={hasActiveFilters ? 'No projects match your filters' : 'No projects yet'}
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filter criteria.'
                : 'Projects will appear here once delivery engagements are created.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Can permission="projects.create">
                  <Button
                    onClick={() => {
                      setCreateDrawerOpen(true);
                    }}
                  >
                    New Project
                  </Button>
                </Can>
              )
            }
          />
        ) : (
          <>
            <ProjectListMobileCards
              projects={projects}
              onEditProject={setEditProjectId}
              onArchiveProject={setArchiveProjectId}
              onRestoreProject={(projectId) => {
                void handleRestore(projectId);
              }}
            />
            <div className="hidden md:block">
              <ProjectListTable
                projects={projects}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={handleSortFieldChange}
                onEditProject={setEditProjectId}
                onArchiveProject={setArchiveProjectId}
                onRestoreProject={(projectId) => {
                  void handleRestore(projectId);
                }}
              />
            </div>
            <ProjectListPagination
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
