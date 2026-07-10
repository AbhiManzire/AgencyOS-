'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import { usePreferences, useUpdatePreferences } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function PreferencesSettingsPage() {
  const { data, isLoading, isError, error, refetch } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const [timezone, setTimezone] = useState('');
  const [currency, setCurrency] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setTimezone(data.timezone);
    setCurrency(data.currency);
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading preferences..." />;
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
        title="Preferences"
        description="Default timezone and currency for operational reports and finance."
      />

      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              timezone: timezone.trim(),
              currency: currency.trim().toUpperCase(),
            },
            {
              onSuccess: () => {
                setMessage('Preferences saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="space-y-1">
          <label htmlFor="pref-timezone" className="text-sm font-medium">
            Timezone
          </label>
          <Input
            id="pref-timezone"
            value={timezone}
            onChange={(event) => {
              setTimezone(event.target.value);
            }}
            placeholder="UTC"
            required
          />
          <p className="text-xs text-muted-foreground">IANA timezone id, e.g. Asia/Kolkata</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="pref-currency" className="text-sm font-medium">
            Currency
          </label>
          <Input
            id="pref-currency"
            value={currency}
            onChange={(event) => {
              setCurrency(event.target.value.toUpperCase());
            }}
            maxLength={3}
            placeholder="USD"
            required
          />
          <p className="text-xs text-muted-foreground">ISO 4217 code (3 letters)</p>
        </div>

        <Can permission="settings.update">
          <Button
            type="submit"
            disabled={
              updateMutation.isPending ||
              timezone.trim().length === 0 ||
              currency.trim().length !== 3
            }
          >
            {updateMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </Can>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </>
  );
}
