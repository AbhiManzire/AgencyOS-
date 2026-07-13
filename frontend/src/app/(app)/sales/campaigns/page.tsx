'use client';

import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  useToast,
} from '@/design-system';
import {
  archiveCampaign,
  createCampaign,
  listCampaigns,
  type SalesCampaignStatus,
} from '@/features/sales/campaigns/api/campaigns.api';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

const STATUS_LABELS: Record<SalesCampaignStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export default function SalesCampaignsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sales-campaigns'],
    queryFn: () => listCampaigns({ take: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: async () => {
      setName('');
      setCode('');
      showToast('Campaign created');
      await queryClient.invalidateQueries({ queryKey: ['sales-campaigns'] });
    },
    onError: (createError: unknown) => {
      showToast(extractApiErrorMessage(createError), 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveCampaign,
    onSuccess: async () => {
      showToast('Campaign archived');
      await queryClient.invalidateQueries({ queryKey: ['sales-campaigns'] });
    },
    onError: (archiveError: unknown) => {
      showToast(extractApiErrorMessage(archiveError), 'error');
    },
  });

  const campaigns = useMemo(() => data?.items ?? [], [data]);
  const errorMessage = error ? extractApiErrorMessage(error) : null;

  return (
    <PageContainer size="2xl">
      <PageHeader
        title="Campaigns"
        description="Segment and attribute leads without a separate Groups module"
      />

      <Can permission="sales.create">
        <form
          className="mb-6 flex flex-wrap items-end gap-2 border-b border-border pb-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length === 0) {
              showToast('Campaign name is required', 'error');
              return;
            }
            createMutation.mutate({
              name: name.trim(),
              ...(code.trim().length > 0 ? { code: code.trim() } : {}),
              status: 'ACTIVE',
            });
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="campaign-name">
              Name
            </label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              placeholder="Q3 Meta campaign"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="campaign-code">
              Code
            </label>
            <Input
              id="campaign-code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
              }}
              placeholder="optional"
            />
          </div>
          <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
            <Plus className="size-4" />
            New campaign
          </Button>
        </form>
      </Can>

      {errorMessage ? (
        <ErrorState
          message={errorMessage}
          action={
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <LoadingState label="Loading campaigns..." />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create a campaign to attribute inbound leads."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{campaign.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{campaign.code ?? '—'}</td>
                  <td className="px-3 py-2">{STATUS_LABELS[campaign.status]}</td>
                  <td className="px-3 py-2 text-right">
                    {campaign.deletedAt === null && campaign.status !== 'ARCHIVED' ? (
                      <Can permission="sales.update">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={archiveMutation.isPending}
                          onClick={() => {
                            archiveMutation.mutate(campaign.id);
                          }}
                        >
                          Archive
                        </Button>
                      </Can>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
