'use client';

import { Avatar } from '@/design-system';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientRowActions } from '@/features/clients/components/client-row-actions';
import { ClientArchivedBadge } from '@/features/clients/components/client-archived-badge';
import { ClientStatusBadge } from '@/features/clients/components/client-status-badge';
import { SortIndicator } from '@/features/clients/components/client-list-toolbar';
import type { ClientListItem, ClientSortField, SortDirection } from '@/features/clients/types';
import { cn } from '@/lib/utils';

interface ClientListTableProps {
  clients: readonly ClientListItem[];
  selectedIds: ReadonlySet<string>;
  sortField: ClientSortField;
  sortDirection: SortDirection;
  onSortFieldChange: (field: ClientSortField) => void;
  onToggleRow: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onEditClient: (clientId: string) => void;
  onArchiveClient: (clientId: string) => void;
  onRestoreClient: (clientId: string) => void;
}

interface SortableHeaderProps {
  label: string;
  field: ClientSortField;
  activeField: ClientSortField;
  direction: SortDirection;
  onSort: (field: ClientSortField) => void;
  className?: string;
}

function SortableHeader({
  label,
  field,
  activeField,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = activeField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="ds-focus-ring inline-flex items-center rounded-sm hover:text-foreground"
        onClick={() => {
          onSort(field);
        }}
      >
        {label}
        <SortIndicator direction={isActive ? direction : null} />
      </button>
    </TableHead>
  );
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate));
}

export function ClientListTable({
  clients,
  selectedIds,
  sortField,
  sortDirection,
  onSortFieldChange,
  onToggleRow,
  onToggleAll,
  onEditClient,
  onArchiveClient,
  onRestoreClient,
}: ClientListTableProps) {
  const allSelected = clients.length > 0 && clients.every((client) => selectedIds.has(client.id));
  const someSelected = clients.some((client) => selectedIds.has(client.id));

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="max-h-[min(70vh,640px)] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={(checked) => {
                    onToggleAll(checked === true);
                  }}
                  aria-label="Select all clients on this page"
                />
              </TableHead>
              <SortableHeader
                label="Client Name"
                field="displayName"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
              />
              <SortableHeader
                label="Company"
                field="company"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label="Status"
                field="status"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
              />
              <SortableHeader
                label="Owner"
                field="owner"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden lg:table-cell"
              />
              <SortableHeader
                label="Email"
                field="email"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden xl:table-cell"
              />
              <TableHead className="hidden xl:table-cell">Phone</TableHead>
              <SortableHeader
                label="Created Date"
                field="createdAt"
                activeField={sortField}
                direction={sortDirection}
                onSort={onSortFieldChange}
                className="hidden lg:table-cell"
              />
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const isSelected = selectedIds.has(client.id);

              return (
                <TableRow
                  key={client.id}
                  data-state={isSelected ? 'selected' : undefined}
                  className={client.isArchived ? 'text-muted-foreground' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        onToggleRow(client.id, checked === true);
                      }}
                      aria-label={`Select ${client.displayName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar initials={client.displayName.slice(0, 2)} size="sm" />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'truncate font-medium',
                            client.isArchived ? 'text-muted-foreground' : 'text-foreground',
                          )}
                        >
                          {client.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {client.company}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                    {client.company}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <ClientStatusBadge status={client.status} />
                      {client.isArchived ? <ClientArchivedBadge /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{client.owner}</TableCell>
                  <TableCell className="hidden max-w-[220px] truncate xl:table-cell">
                    {client.email}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{client.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatDate(client.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ClientRowActions
                      clientId={client.id}
                      clientName={client.displayName}
                      isArchived={client.isArchived}
                      onEdit={onEditClient}
                      onArchive={onArchiveClient}
                      onRestore={onRestoreClient}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/** Compact card list for narrow viewports. */
export function ClientListMobileCards({
  clients,
  selectedIds,
  onToggleRow,
  onEditClient,
  onArchiveClient,
  onRestoreClient,
}: Pick<
  ClientListTableProps,
  'clients' | 'selectedIds' | 'onToggleRow' | 'onEditClient' | 'onArchiveClient' | 'onRestoreClient'
>) {
  return (
    <div className="space-y-3 md:hidden">
      {clients.map((client) => (
        <div
          key={client.id}
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            client.isArchived && 'text-muted-foreground',
            selectedIds.has(client.id) && 'ring-2 ring-primary/20',
          )}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={selectedIds.has(client.id)}
              onCheckedChange={(checked) => {
                onToggleRow(client.id, checked === true);
              }}
              aria-label={`Select ${client.displayName}`}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn('font-medium', client.isArchived && 'text-muted-foreground')}>
                    {client.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ClientStatusBadge status={client.status} />
                  {client.isArchived ? <ClientArchivedBadge /> : null}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{client.owner}</p>
              <p className="truncate text-sm">{client.email}</p>
            </div>
            <ClientRowActions
              clientId={client.id}
              clientName={client.displayName}
              isArchived={client.isArchived}
              onEdit={onEditClient}
              onArchive={onArchiveClient}
              onRestore={onRestoreClient}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
