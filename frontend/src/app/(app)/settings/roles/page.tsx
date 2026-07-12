'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import { useCreateSettingsRole, useSettingsRoles } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function RolesSettingsPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useSettingsRoles();
  const createMutation = useCreateSettingsRole();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);

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
      <PageHeader
        title="Role Management"
        description="Create custom roles and manage permission catalogs."
      />

      <Can permission={['settings.update', 'roles.manage']} match="any">
        <form
          className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            createMutation.mutate(
              {
                name: name.trim(),
                description: description.trim().length > 0 ? description.trim() : null,
              },
              {
                onSuccess: (role) => {
                  setName('');
                  setDescription('');
                  setMessage(`Role "${role.name}" created.`);
                  router.push(`/settings/roles/${role.id}`);
                },
                onError: (err) => {
                  setMessage(extractApiErrorMessage(err));
                },
              },
            );
          }}
        >
          <div className="space-y-1">
            <label htmlFor="role-name" className="text-sm font-medium">
              Role name
            </label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              required
              className="min-w-[180px]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="role-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="role-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
              }}
              className="min-w-[220px]"
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending || name.trim().length === 0}>
            {createMutation.isPending ? 'Creating…' : 'Create role'}
          </Button>
        </form>
      </Can>

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
                    <Link href={`/settings/roles/${role.id}`}>Edit</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </>
  );
}
