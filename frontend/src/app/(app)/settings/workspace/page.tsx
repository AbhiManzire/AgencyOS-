'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import {
  useUpdateWorkspaceSettings,
  useWorkspaceSettings,
} from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function WorkspaceSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useWorkspaceSettings();
  const updateMutation = useUpdateWorkspaceSettings();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading workspace settings..." />;
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
      <PageHeader
        title="Workspace Settings"
        description="Operational workspace identity for this tenant."
      />

      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            { name: name.trim() },
            {
              onSuccess: () => {
                setMessage('Workspace settings saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="space-y-1">
          <label htmlFor="workspace-name" className="text-sm font-medium">
            Workspace name
          </label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <Input value={data.slug} disabled readOnly />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Input value={data.isActive ? 'Active' : 'Inactive'} disabled readOnly />
        </div>

        <Can permission="settings.update">
          <Button type="submit" disabled={updateMutation.isPending || name.trim().length === 0}>
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </Can>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}
