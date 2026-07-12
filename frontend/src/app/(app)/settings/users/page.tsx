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
import { ClientListPagination } from '@/features/clients/components/client-list-pagination';
import {
  useArchiveUser,
  useAssignUserRole,
  useDeactivateUser,
  useInviteUser,
  useReactivateUser,
  useResetUserPassword,
  useRestoreUser,
  useRevokeUserRole,
  useSettingsRoles,
  useSettingsUsers,
  useUnlockUser,
} from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

function formatDate(value: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function UsersSettingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const listParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    [page, pageSize, search, status],
  );

  const usersQuery = useSettingsUsers(listParams);
  const rolesQuery = useSettingsRoles();
  const inviteMutation = useInviteUser();
  const assignMutation = useAssignUserRole();
  const revokeMutation = useRevokeUserRole();
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const archiveMutation = useArchiveUser();
  const restoreMutation = useRestoreUser();
  const unlockMutation = useUnlockUser();
  const resetPasswordMutation = useResetUserPassword();

  const roles = rolesQuery.data ?? [];
  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const actionPending =
    deactivateMutation.isPending ||
    reactivateMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    unlockMutation.isPending ||
    resetPasswordMutation.isPending;

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
        description="Invite members, assign roles, and manage access lifecycle."
      />

      <Can permission={['settings.update', 'users.manage']} match="any">
        <form
          className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage(null);
            inviteMutation.mutate(
              {
                email: inviteEmail.trim(),
                roleId: inviteRoleId || undefined,
              },
              {
                onSuccess: () => {
                  setMessage(`Invitation sent to ${inviteEmail.trim()}.`);
                  setInviteEmail('');
                  setInviteRoleId('');
                },
                onError: (err) => {
                  setMessage(extractApiErrorMessage(err));
                },
              },
            );
          }}
        >
          <div className="space-y-1">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Invite email
            </label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(event) => {
                setInviteEmail(event.target.value);
              }}
              required
              className="min-w-[220px]"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="invite-role" className="text-sm font-medium">
              Role (optional)
            </label>
            <NativeSelect
              id="invite-role"
              label="Invite role"
              value={inviteRoleId}
              onChange={(event) => {
                setInviteRoleId(event.target.value);
              }}
            >
              <option value="">No default role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button
            type="submit"
            disabled={inviteMutation.isPending || inviteEmail.trim().length === 0}
          >
            {inviteMutation.isPending ? 'Inviting…' : 'Invite'}
          </Button>
        </form>
      </Can>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="users-search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="users-search"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Name or email"
            className="min-w-[200px]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="users-status" className="text-sm font-medium">
            Status
          </label>
          <NativeSelect
            id="users-status"
            label="Status"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </NativeSelect>
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users" description="No members match the current filters." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>{user.designation ?? user.jobTitle ?? '—'}</TableCell>
                  <TableCell>{user.departmentName ?? '—'}</TableCell>
                  <TableCell>{user.managerName ?? '—'}</TableCell>
                  <TableCell className="text-xs">{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    {user.lockedUntil ? 'Locked' : user.isActive ? user.status : 'Inactive'}
                  </TableCell>
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
                                        setMessage(
                                          `Removed ${role.name} from ${user.displayName}.`,
                                        );
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
                    <Can permission="settings.update">
                      <div className="mt-2 flex items-center gap-2">
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
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
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
                  <TableCell>
                    <Can permission={['settings.update', 'users.manage']} match="any">
                      <div className="flex flex-wrap gap-1">
                        {user.isActive ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionPending}
                            onClick={() => {
                              setMessage(null);
                              deactivateMutation.mutate(user.userId, {
                                onSuccess: () => {
                                  setMessage(`${user.displayName} deactivated.`);
                                },
                                onError: (err) => {
                                  setMessage(extractApiErrorMessage(err));
                                },
                              });
                            }}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionPending}
                            onClick={() => {
                              setMessage(null);
                              reactivateMutation.mutate(user.userId, {
                                onSuccess: () => {
                                  setMessage(`${user.displayName} reactivated.`);
                                },
                                onError: (err) => {
                                  setMessage(extractApiErrorMessage(err));
                                },
                              });
                            }}
                          >
                            Reactivate
                          </Button>
                        )}
                        {user.status === 'ARCHIVED' ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionPending}
                            onClick={() => {
                              setMessage(null);
                              restoreMutation.mutate(user.userId, {
                                onSuccess: () => {
                                  setMessage(`${user.displayName} restored.`);
                                },
                                onError: (err) => {
                                  setMessage(extractApiErrorMessage(err));
                                },
                              });
                            }}
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionPending}
                            onClick={() => {
                              setMessage(null);
                              archiveMutation.mutate(user.userId, {
                                onSuccess: () => {
                                  setMessage(`${user.displayName} archived.`);
                                },
                                onError: (err) => {
                                  setMessage(extractApiErrorMessage(err));
                                },
                              });
                            }}
                          >
                            Archive
                          </Button>
                        )}
                        {user.lockedUntil ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionPending}
                            onClick={() => {
                              setMessage(null);
                              unlockMutation.mutate(user.userId, {
                                onSuccess: () => {
                                  setMessage(`${user.displayName} unlocked.`);
                                },
                                onError: (err) => {
                                  setMessage(extractApiErrorMessage(err));
                                },
                              });
                            }}
                          >
                            Unlock
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionPending}
                          onClick={() => {
                            setMessage(null);
                            resetPasswordMutation.mutate(user.userId, {
                              onSuccess: () => {
                                setMessage(`Password reset email queued for ${user.displayName}.`);
                              },
                              onError: (err) => {
                                setMessage(extractApiErrorMessage(err));
                              },
                            });
                          }}
                        >
                          Reset password
                        </Button>
                      </div>
                    </Can>
                  </TableCell>
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

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </>
  );
}
