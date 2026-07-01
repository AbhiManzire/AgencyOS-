'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader } from '@/design-system';
import { mapClientRecordToListItem } from '@/features/clients/api/client.mapper';
import { useClients } from '@/features/clients/hooks/use-clients';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import { CreateProjectDrawer } from '@/features/projects/components/create-project-drawer';
import {
  ProjectListMobileCards,
  ProjectListTable,
} from '@/features/projects/components/project-list-table';
import { ProjectListPagination } from '@/features/projects/components/project-list-pagination';
import { ProjectListToolbar } from '@/features/projects/components/project-list-toolbar';
import { useProjects } from '@/features/projects/hooks/use-projects';
import type {
  ProjectListItem,
  ProjectListStatusFilter,
  ProjectSortField,
  SortDirection,
} from '@/features/projects/types';
import { resolveListProjectsQuery } from '@/features/projects/utils/list-projects-query';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

function compareProjects(
  a: ProjectListItem,
  b: ProjectListItem,
  field: ProjectSortField,
  direction: SortDirection,
): number {
  if (field === 'targetEndDate' || field === 'updatedAt') {
    const aTime = a[field] ? new Date(a[field]).getTime() : 0;
    const bTime = b[field] ? new Date(b[field]).getTime() : 0;
    const result = aTime - bTime;
    return direction === 'asc' ? result : -result;
  }

  const result = a[field].localeCompare(b[field], undefined, { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectListStatusFilter>('all');
  const [sortField, setSortField] = useState<ProjectSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const { params: listParams, usesClientSideListProcessing } = resolveListProjectsQuery(
    statusFilter,
    page,
    pageSize,
  );

  const { data, isLoading, isFetching, error, refetch } = useProjects(listParams);
  const { data: clientsData } = useClients({ take: 100 });

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

  const matchingProjects = useMemo(() => {
    if (!data) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return data.items
      .map((record) => mapProjectRecordToListItem(record, { clientNamesById }))
      .filter((project) => {
        if (query.length === 0) {
          return true;
        }

        return (
          project.name.toLowerCase().includes(query) ||
          project.code.toLowerCase().includes(query) ||
          project.clientName.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => compareProjects(a, b, sortField, sortDirection));
  }, [clientNamesById, data, search, sortDirection, sortField]);

  const filteredProjects = useMemo(() => {
    if (!usesClientSideListProcessing) {
      return matchingProjects;
    }

    const start = (page - 1) * pageSize;
    return matchingProjects.slice(start, start + pageSize);
  }, [matchingProjects, page, pageSize, usesClientSideListProcessing]);

  const totalItems = matchingProjects.length;
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'all';
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  const handleSortFieldChange = (field: ProjectSortField): void => {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const clearFilters = (): void => {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  };

  const handleRefresh = (): void => {
    void refetch();
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

      <div className="space-y-4">
        <ProjectListToolbar
          search={search}
          statusFilter={statusFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          isRefreshing={isFetching && !isLoading}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusFilterChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          onSortFieldChange={setSortField}
          onSortDirectionToggle={() => {
            setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
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
        ) : filteredProjects.length === 0 ? (
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
            <ProjectListMobileCards projects={filteredProjects} />
            <div className="hidden md:block">
              <ProjectListTable
                projects={filteredProjects}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={handleSortFieldChange}
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
