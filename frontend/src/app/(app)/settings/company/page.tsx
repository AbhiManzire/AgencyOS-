'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState, LoadingState, PageHeader } from '@/design-system';
import { useCompanyProfile, useUpdateCompanyProfile } from '@/features/settings/hooks/use-settings';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

export default function CompanySettingsPage() {
  const { data, isLoading, isError, error, refetch } = useCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }
    setName(data.name);
    setLegalName(data.legalName ?? '');
  }, [data]);

  if (isLoading) {
    return <LoadingState label="Loading company profile..." />;
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
        title="Company Profile"
        description="Agency identity used across invoices and client-facing records."
      />

      <form
        className="max-w-xl space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          updateMutation.mutate(
            {
              name: name.trim(),
              legalName: legalName.trim().length > 0 ? legalName.trim() : null,
            },
            {
              onSuccess: () => {
                setMessage('Company profile saved.');
              },
              onError: (err) => {
                setMessage(extractApiErrorMessage(err));
              },
            },
          );
        }}
      >
        <div className="space-y-1">
          <label htmlFor="company-name" className="text-sm font-medium">
            Agency name
          </label>
          <Input
            id="company-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="company-legal-name" className="text-sm font-medium">
            Legal name
          </label>
          <Input
            id="company-legal-name"
            value={legalName}
            onChange={(event) => {
              setLegalName(event.target.value);
            }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Slug</label>
          <Input value={data.slug} disabled readOnly />
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
