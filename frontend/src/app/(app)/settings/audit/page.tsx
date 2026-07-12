'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import { AUDIT_ACTIONS } from '@/features/audit/api/audit.types';
import { useAuditLogs } from '@/features/audit/hooks/use-audit-logs';
import { ClientListPagination } from '@/features/clients/components/client-list-pagination';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { PermissionRoute } from '@/lib/rbac';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function AuditLogsPageContent() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      action: action || undefined,
      category: category.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
      sortDir: 'desc' as const,
    }),
    [action, category, from, page, pageSize, search, to],
  );

  const { data, isLoading, isError, error, refetch } = useAuditLogs(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  if (isLoading) {
    return <LoadingState label="Loading audit logs..." />;
  }

  if (isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader title="Audit Logs" description="Workspace security and change history." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label htmlFor="audit-search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="audit-search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Summary text"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-action" className="text-sm font-medium">
            Action
          </label>
          <NativeSelect
            id="audit-action"
            label="Action"
            value={action}
            onChange={(event) => {
              setPage(1);
              setAction(event.target.value);
            }}
          >
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-category" className="text-sm font-medium">
            Category
          </label>
          <Input
            id="audit-category"
            value={category}
            onChange={(event) => {
              setPage(1);
              setCategory(event.target.value);
            }}
            placeholder="settings, security…"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-from" className="text-sm font-medium">
            From
          </label>
          <Input
            id="audit-from"
            type="date"
            value={from}
            onChange={(event) => {
              setPage(1);
              setFrom(event.target.value);
            }}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="audit-to" className="text-sm font-medium">
            To
          </label>
          <Input
            id="audit-to"
            type="date"
            value={to}
            onChange={(event) => {
              setPage(1);
              setTo(event.target.value);
            }}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No audit events" description="No logs match the current filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {formatDate(item.occurredAt)}
                  </TableCell>
                  <TableCell>{item.actorDisplayName ?? item.actorUserId ?? 'System'}</TableCell>
                  <TableCell className="font-mono text-xs">{item.action}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <ClientListPagination
              page={page}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={setPage}
              onPageSizeChange={(next) => {
                setPage(1);
                setPageSize(next);
              }}
            />
          </div>
        </>
      )}
    </>
  );
}

export default function AuditLogsPage() {
  return (
    <PermissionRoute permission="audit.read">
      <AuditLogsPageContent />
    </PermissionRoute>
  );
}
