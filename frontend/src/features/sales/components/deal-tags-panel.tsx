'use client';

import { X } from 'lucide-react';
import { useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, StatusBadge, useToast } from '@/design-system';
import {
  useAssignDealTag,
  useUnassignDealTag,
} from '@/features/sales/deals/tags/hooks/use-deal-tag-mutations';
import { useDealTags } from '@/features/sales/deals/tags/hooks/use-deal-tags';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { Can } from '@/lib/rbac';

interface DealTagsPanelProps {
  readonly dealId: string;
  readonly readOnly?: boolean;
}

export function DealTagsPanel({ dealId, readOnly = false }: DealTagsPanelProps) {
  const { showToast } = useToast();
  const [tagName, setTagName] = useState('');
  const { data: tags = [], isLoading, error, refetch } = useDealTags(dealId);
  const { mutateAsync: assignTag, isPending: isAssigning } = useAssignDealTag(dealId);
  const { mutateAsync: unassignTag, isPending: isUnassigning } = useUnassignDealTag(dealId);

  const handleAssign = async (): Promise<void> => {
    const name = tagName.trim();
    if (name.length === 0) {
      return;
    }

    try {
      await assignTag({ name });
      setTagName('');
      showToast('Tag added');
    } catch (assignError) {
      showToast(extractApiErrorMessage(assignError), 'error');
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void handleAssign();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleAssign();
    }
  };

  const handleUnassign = async (tagId: string): Promise<void> => {
    try {
      await unassignTag(tagId);
      showToast('Tag removed');
    } catch (unassignError) {
      showToast(extractApiErrorMessage(unassignError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading tags..." />;
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

  return (
    <div className="space-y-4">
      {tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Add tags to segment this deal." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <StatusBadge key={tag.id} variant="neutral" className="gap-1 pr-1">
              {tag.name}
              {readOnly ? null : (
                <Can permission="sales.update" mode="hide">
                  <button
                    type="button"
                    className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                    aria-label={`Remove tag ${tag.name}`}
                    disabled={isUnassigning}
                    onClick={() => {
                      void handleUnassign(tag.id);
                    }}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Can>
              )}
            </StatusBadge>
          ))}
        </div>
      )}

      {readOnly ? null : (
        <Can permission="sales.update" mode="hide">
          <form className="flex flex-wrap items-center gap-2" onSubmit={handleSubmit}>
            <input
              type="text"
              value={tagName}
              onChange={(event) => {
                setTagName(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag"
              maxLength={64}
              className="h-9 min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isAssigning}
            />
            <Button type="submit" disabled={isAssigning || tagName.trim().length === 0}>
              Add
            </Button>
          </form>
        </Can>
      )}
    </div>
  );
}
