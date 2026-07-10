'use client';

import Link from 'next/link';
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
import { useSettingsRoles } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

export default function RolesSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSettingsRoles();

  if (isLoading) {
    return <LoadingState label="Loading roles..." />;
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

  const roles = data ?? [];

  return (
    <>
      <PageHeader title="Role Management" description="Tenant roles and their permission counts." />

      {roles.length === 0 ? (
        <EmptyState title="No roles" description="No roles are defined for this tenant yet." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>System</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <div className="font-medium">{role.name}</div>
                  {role.description ? (
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  ) : null}
                </TableCell>
                <TableCell>{role.slug}</TableCell>
                <TableCell>{role.isSystem ? 'Yes' : 'No'}</TableCell>
                <TableCell>{role.permissionCount}</TableCell>
                <TableCell>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link href={`/settings/roles/${role.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
