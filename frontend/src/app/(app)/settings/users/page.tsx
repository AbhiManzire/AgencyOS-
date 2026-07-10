'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  useAssignUserRole,
  useRevokeUserRole,
  useSettingsRoles,
  useSettingsUsers,
} from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function UsersSettingsPage() {
  const usersQuery = useSettingsUsers();
  const rolesQuery = useSettingsRoles();
  const assignMutation = useAssignUserRole();
  const revokeMutation = useRevokeUserRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const roles = rolesQuery.data ?? [];
  const users = usersQuery.data ?? [];

  const roleOptions = useMemo(
    () => roles.map((role) => ({ id: role.id, label: role.name })),
    [roles],
  );

  if (usersQuery.isLoading || rolesQuery.isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(usersQuery.error)}
        action={
          <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Workspace members and their assigned roles."
      />

      {users.length === 0 ? (
        <EmptyState
          title="No users"
          description="No active employees are linked to this workspace yet."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Assign</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </TableCell>
                <TableCell>{user.jobTitle ?? '—'}</TableCell>
                <TableCell>{user.isActive ? user.status : 'Inactive'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs"
                        >
                          {role.name}
                          <Can permission="settings.update">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={revokeMutation.isPending}
                              onClick={() => {
                                setMessage(null);
                                revokeMutation.mutate(
                                  { userId: user.userId, roleId: role.id },
                                  {
                                    onSuccess: () => {
                                      setMessage(`Removed ${role.name} from ${user.displayName}.`);
                                    },
                                    onError: (err) => {
                                      setMessage(extractApiErrorMessage(err));
                                    },
                                  },
                                );
                              }}
                            >
                              ×
                            </button>
                          </Can>
                        </span>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Can permission="settings.update">
                    <div className="flex items-center gap-2">
                      <NativeSelect
                        label={`Assign role for ${user.displayName}`}
                        value={selectedRoles[user.userId] ?? ''}
                        onChange={(event) => {
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [user.userId]: event.target.value,
                          }));
                        }}
                      >
                        <option value="">Select role</option>
                        {roleOptions.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.label}
                          </option>
                        ))}
                      </NativeSelect>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={
                          assignMutation.isPending ||
                          !(selectedRoles[user.userId] && selectedRoles[user.userId].length > 0)
                        }
                        onClick={() => {
                          const roleId = selectedRoles[user.userId];
                          if (!roleId) {
                            return;
                          }
                          setMessage(null);
                          assignMutation.mutate(
                            { userId: user.userId, roleId },
                            {
                              onSuccess: () => {
                                setMessage(`Role assigned to ${user.displayName}.`);
                                setSelectedRoles((prev) => ({ ...prev, [user.userId]: '' }));
                              },
                              onError: (err) => {
                                setMessage(extractApiErrorMessage(err));
                              },
                            },
                          );
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  </Can>
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
