'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/design-system';
import { mapClientRecordToListItem } from '@/features/clients/api/client.mapper';
import { useClients } from '@/features/clients/hooks/use-clients';
import { mapProjectRecordToListItem } from '@/features/projects/api/project.mapper';
import {
  ProjectListMobileCards,
  ProjectListTable,
} from '@/features/projects/components/project-list-table';
import { useProjectWorkspaceOwners } from '@/features/projects/hooks/use-project-meta';
import { useProjects } from '@/features/projects/hooks/use-projects';
import type {
  ProjectSortField,
  SortDirection,
  WorkspaceOwnerOption,
} from '@/features/projects/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const DEFAULT_SORT_FIELD: ProjectSortField = 'updatedAt';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

function noop(): void {
  // Dashboard recent projects is read-only for row actions.
}

export function DashboardRecentProjects() {
  const { data, isLoading, error, refetch } = useProjects({
    take: 5,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const { data: clientsData } = useClients({ take: 100 });
  const { data: owners = [] } = useProjectWorkspaceOwners();

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

  const recentProjects = useMemo(
    () =>
      data
        ? data.items.map((record) =>
            mapProjectRecordToListItem(record, { clientNamesById, ownersById }),
          )
        : [],
    [clientNamesById, data, ownersById],
  );

  if (isLoading) {
    return <LoadingState label="Loading recent projects..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <ProjectListMobileCards
        projects={recentProjects}
        onEditProject={noop}
        onArchiveProject={noop}
        onRestoreProject={noop}
      />
      <div className="hidden md:block">
        <ProjectListTable
          projects={recentProjects}
          sortField={DEFAULT_SORT_FIELD}
          sortDirection={DEFAULT_SORT_DIRECTION}
          onSortFieldChange={noop}
          onEditProject={noop}
          onArchiveProject={noop}
          onRestoreProject={noop}
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/projects">View All</Link>
        </Button>
      </div>
    </div>
  );
}
