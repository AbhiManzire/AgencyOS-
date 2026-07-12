'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/design-system';
import {
  useDeleteSettingsRole,
  useSetRolePermissions,
  useSettingsRole,
  useUpdateSettingsRole,
} from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can, fetchPermissionCatalog } from '@/lib/rbac';

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roleId = params.id;
  const { data, isLoading, isError, error, refetch } = useSettingsRole(roleId);
  const catalogQuery = useQuery({
    queryKey: ['rbac', 'permissions', 'catalog'],
    queryFn: fetchPermissionCatalog,
    staleTime: 5 * 60_000,
  });
  const updateMutation = useUpdateSettingsRole();
  const permissionsMutation = useSetRolePermissions();
  const deleteMutation = useDeleteSettingsRole();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
    setDescription(data.description ?? '');
    setSelectedIds(new Set(data.permissions.map((permission) => permission.id)));
  }, [data]);

  const groupedCatalog = useMemo(() => {
    const catalog = catalogQuery.data ?? [];
    const groups = new Map<string, typeof catalog>();
    for (const item of catalog) {
      const moduleKey = item.module ?? 'general';
      const existing = groups.get(moduleKey) ?? [];
      groups.set(moduleKey, [...existing, item]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [catalogQuery.data]);

  if (isLoading || catalogQuery.isLoading) {
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

      <PageHeader title={data.name} description={data.isSystem ? 'System role' : 'Custom role'} />

      <form
        className="mb-8 max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              roleId,
              body: {
                name: name.trim(),
                description: description.trim().length > 0 ? description.trim() : null,
              },
            },
            {
              onSuccess: () => {
                setMessage('Role details saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="space-y-1">
          <label htmlFor="role-detail-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="role-detail-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
            disabled={data.isSystem}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="role-detail-description" className="text-sm font-medium">
            Description
          </label>
          <Input
            id="role-detail-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <Input value={data.slug} disabled readOnly />
        </div>

        <Can permission={['settings.update', 'roles.manage']} match="any">
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={updateMutation.isPending || name.trim().length === 0 || data.isSystem}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save details'}
            </Button>
            {!data.isSystem ? (
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  deleteMutation.mutate(roleId, {
                    onSuccess: () => {
                      router.push('/settings/roles');
                    },
                    onError: (err) => {
                      setMessage(extractApiErrorMessage(err));
                    },
                  });
                }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete role'}
              </Button>
            ) : null}
          </div>
        </Can>
      </form>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Permission matrix</h2>
        <Can permission={['settings.update', 'roles.manage']} match="any">
          <Button
            type="button"
            disabled={permissionsMutation.isPending}
            onClick={() => {
              setMessage(null);
              permissionsMutation.mutate(
                {
                  roleId,
                  body: { permissionIds: Array.from(selectedIds) },
                },
                {
                  onSuccess: () => {
                    setMessage('Permissions saved.');
                  },
                  onError: (err) => {
                    setMessage(extractApiErrorMessage(err));
                  },
                },
              );
            }}
          >
            {permissionsMutation.isPending ? 'Saving…' : 'Save permissions'}
          </Button>
        </Can>
      </div>

      {groupedCatalog.length === 0 ? (
        <EmptyState title="No permissions" description="Permission catalog is empty." />
      ) : (
        <div className="space-y-6">
          {groupedCatalog.map(([moduleKey, items]) => (
            <section key={moduleKey} className="rounded-lg border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold capitalize">{moduleKey}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((permission) => {
                  const checked = selectedIds.has(permission.id);
                  return (
                    <label key={permission.id} className="flex items-start gap-2 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={(next) => {
                          const isChecked = next === true;
                          setSelectedIds((prev) => {
                            const nextSet = new Set(prev);
                            if (isChecked) {
                              nextSet.add(permission.id);
                            } else {
                              nextSet.delete(permission.id);
                            }
                            return nextSet;
                          });
                        }}
                      />
                      <span>
                        <span className="font-medium">{permission.name}</span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {permission.key}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </>
  );
}
