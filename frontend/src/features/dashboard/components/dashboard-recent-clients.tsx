'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/design-system';
import { mapClientRecordToListItem } from '@/features/clients/api/client.mapper';
import {
  ClientListMobileCards,
  ClientListTable,
} from '@/features/clients/components/client-list-table';
import { useClients } from '@/features/clients/hooks/use-clients';
import type { ClientSortField, SortDirection } from '@/features/clients/types';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

const EMPTY_SELECTION = new Set<string>();
const DEFAULT_SORT_FIELD: ClientSortField = 'createdAt';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

function noop(): void {
  // Dashboard table is read-only for selection and bulk actions.
}

export function DashboardRecentClients() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useClients({ take: 5 });

  const recentClients = useMemo(
    () => (data ? data.items.map((record) => mapClientRecordToListItem(record)) : []),
    [data],
  );

  const openClient = (clientId: string): void => {
    router.push(`/clients/${clientId}`);
  };

  if (isLoading) {
    return <LoadingState label="Loading recent clients..." />;
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
      <ClientListMobileCards
        clients={recentClients}
        selectedIds={EMPTY_SELECTION}
        onToggleRow={noop}
        onEditClient={openClient}
        onArchiveClient={noop}
        onRestoreClient={noop}
      />
      <div className="hidden md:block">
        <ClientListTable
          clients={recentClients}
          selectedIds={EMPTY_SELECTION}
          sortField={DEFAULT_SORT_FIELD}
          sortDirection={DEFAULT_SORT_DIRECTION}
          onSortFieldChange={noop}
          onToggleRow={noop}
          onToggleAll={noop}
          onEditClient={openClient}
          onArchiveClient={noop}
          onRestoreClient={noop}
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/clients">View All</Link>
        </Button>
      </div>
    </div>
  );
}
