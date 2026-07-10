'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import { useSettingsRole } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const roleId = params.id;
  const { data, isLoading, isError, error, refetch } = useSettingsRole(roleId);

  if (isLoading) {
    return <LoadingState label="Loading role..." />;
  }

  if (isError || !data) {
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
      <Button variant="ghost" size="sm" className="mb-4 gap-2 px-0" asChild>
        <Link href="/settings/roles">
          <ArrowLeft className="size-4" />
          Back to roles
        </Link>
      </Button>

      <PageHeader title={data.name} description={data.description ?? `Slug: ${data.slug}`} />

      <p className="mb-4 text-sm text-muted-foreground">
        {data.isSystem ? 'System role' : 'Custom role'} · {data.permissions.length} permissions
      </p>

      {data.permissions.length === 0 ? (
        <EmptyState title="No permissions" description="This role has no permissions assigned." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell className="font-mono text-xs">{permission.key}</TableCell>
                <TableCell>{permission.name}</TableCell>
                <TableCell>{permission.module ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {permission.description ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
