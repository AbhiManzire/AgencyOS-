'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import { useSystemSettings, useUpdateSystemSettings } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can, PermissionRoute } from '@/lib/rbac';

const DEFAULT_FLAGS = ['analytics', 'experimentalUi', 'betaExports'] as const;

function SystemSettingsContent() {
  const { data, isLoading, isError, error, refetch } = useSystemSettings();
  const updateMutation = useUpdateSystemSettings();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxUploadBytes, setMaxUploadBytes] = useState(10_485_760);
  const [allowedFileTypes, setAllowedFileTypes] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setMaintenanceMode(data.maintenanceMode);
    setMaxUploadBytes(data.maxUploadBytes);
    setAllowedFileTypes(data.allowedFileTypes.join(', '));
    setEmailFrom(data.emailFrom);
    const flags: Record<string, boolean> = { ...data.featureFlags };
    for (const key of DEFAULT_FLAGS) {
      flags[key] ??= false;
    }
    setFeatureFlags(flags);
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading system settings..." />;
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

  const flagKeys = Array.from(new Set([...DEFAULT_FLAGS, ...Object.keys(featureFlags)])).sort();

  return (
    <>
      <PageHeader
        title="System"
        description="Feature flags, maintenance mode, upload limits, and platform defaults."
      />

      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          const types = allowedFileTypes
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
          updateMutation.mutate(
            {
              maintenanceMode,
              maxUploadBytes,
              allowedFileTypes: types,
              emailFrom: emailFrom.trim(),
              featureFlags,
            },
            {
              onSuccess: () => {
                setMessage('System settings saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="space-y-1">
          <label className="text-sm font-medium">App version</label>
          <Input value={data.appVersion || '—'} disabled readOnly />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={maintenanceMode}
            onCheckedChange={(next) => {
              setMaintenanceMode(next === true);
            }}
          />
          Maintenance mode
        </label>

        <div className="space-y-1">
          <label htmlFor="max-upload" className="text-sm font-medium">
            Max upload bytes
          </label>
          <Input
            id="max-upload"
            type="number"
            min={1}
            value={maxUploadBytes}
            onChange={(event) => {
              setMaxUploadBytes(Number(event.target.value));
            }}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="allowed-types" className="text-sm font-medium">
            Allowed file types
          </label>
          <Input
            id="allowed-types"
            value={allowedFileTypes}
            onChange={(event) => {
              setAllowedFileTypes(event.target.value);
            }}
            placeholder="pdf, png, jpg, xlsx"
          />
          <p className="text-xs text-muted-foreground">Comma-separated extensions</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email-from" className="text-sm font-medium">
            Email from address
          </label>
          <Input
            id="email-from"
            type="email"
            value={emailFrom}
            onChange={(event) => {
              setEmailFrom(event.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Feature flags</p>
          {flagKeys.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={featureFlags[key] ?? false}
                onCheckedChange={(next) => {
                  setFeatureFlags((prev) => ({
                    ...prev,
                    [key]: next === true,
                  }));
                }}
              />
              {key}
            </label>
          ))}
        </div>

        <Can permission={['admin.system', 'settings.update']} match="any">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving…' : 'Save system settings'}
          </Button>
        </Can>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}

export default function SystemSettingsPage() {
  return (
    <PermissionRoute permission={['admin.system', 'settings.read']} match="any">
      <SystemSettingsContent />
    </PermissionRoute>
  );
}
