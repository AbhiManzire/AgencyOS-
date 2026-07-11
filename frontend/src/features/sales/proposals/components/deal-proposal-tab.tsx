'use client';

import { Loader2, Plus, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { EmptyState, ErrorState, LoadingState, StatusBadge, useToast } from '@/design-system';
import { useCreateProposal } from '@/features/sales/proposals/hooks/use-create-proposal';
import { useProposals } from '@/features/sales/proposals/hooks/use-proposals';
import { PROPOSAL_STATUS_LABELS } from '@/features/sales/proposals/proposal-sections';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';
import { formatShortDate } from '@/lib/format/date';

interface DealProposalTabProps {
  readonly dealId: string;
}

export function DealProposalTab({ dealId }: DealProposalTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { allowed: canCreate } = usePermission('proposals.create');
  const { allowed: canRead } = usePermission('proposals.read');
  const { mutateAsync: createProposal, isPending } = useCreateProposal();
  const { data, isLoading, error, refetch } = useProposals(
    { dealId, take: 50 },
    { enabled: canRead },
  );
  const [title, setTitle] = useState('');

  const handleCreate = async (): Promise<void> => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      showToast('Enter a proposal title', 'error');
      return;
    }

    try {
      const proposal = await createProposal({
        dealId,
        title: trimmedTitle,
      });
      showToast('Proposal created', 'success');
      router.push(`/sales/proposals/${proposal.id}`);
    } catch (createError) {
      showToast(extractApiErrorMessage(createError), 'error');
    }
  };

  if (!canRead) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No proposal access"
        description="You do not have permission to view proposals for this deal."
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading proposals..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const proposals = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Proposal</h2>
          <p className="text-sm text-muted-foreground">
            Build a structured proposal with sections, autosave, and versioning.
          </p>
        </div>
      </div>

      {proposals.length > 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Version</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow
                  key={proposal.id}
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(`/sales/proposals/${proposal.id}`);
                  }}
                >
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell>
                    <StatusBadge variant="neutral">
                      {PROPOSAL_STATUS_LABELS[proposal.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">v{proposal.version}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatShortDate(proposal.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="No proposal yet"
          description="Start a new proposal for this deal and open the editor."
        />
      )}

      {canCreate ? (
        <div className="flex w-full max-w-md flex-col gap-3">
          <Input
            value={title}
            placeholder="Proposal title"
            disabled={isPending}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
          <Button
            type="button"
            className="gap-2"
            disabled={isPending}
            onClick={() => {
              void handleCreate();
            }}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create Proposal
          </Button>
        </div>
      ) : null}
    </div>
  );
}
