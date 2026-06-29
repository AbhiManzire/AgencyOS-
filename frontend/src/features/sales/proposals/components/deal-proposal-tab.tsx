'use client';

import { Loader2, Plus, ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, useToast } from '@/design-system';
import { useCreateProposal } from '@/features/sales/proposals/hooks/use-create-proposal';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { usePermission } from '@/lib/rbac/use-permission';

interface DealProposalTabProps {
  readonly dealId: string;
}

export function DealProposalTab({ dealId }: DealProposalTabProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { allowed: canCreate } = usePermission('proposals.create');
  const { mutateAsync: createProposal, isPending } = useCreateProposal();
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

  if (!canCreate) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No proposal yet"
        description="You do not have permission to create proposals for this deal."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Proposal</h2>
        <p className="text-sm text-muted-foreground">
          Build a structured proposal with sections, autosave, and versioning.
        </p>
      </div>

      <EmptyState
        icon={ScrollText}
        title="Create a proposal"
        description="Start a new proposal for this deal and open the editor."
        action={
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
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create Proposal
            </Button>
          </div>
        }
      />
    </div>
  );
}
