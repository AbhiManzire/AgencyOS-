'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/design-system';
import { Body, Caption } from '@/design-system/typography';
import { CommentComposer } from '@/features/comments/components/comment-composer';
import type { CommentListItem } from '@/features/comments/types';
import { Can } from '@/lib/rbac';

interface CommentItemProps {
  readonly comment: CommentListItem;
  readonly isEditing?: boolean;
  readonly isPending?: boolean;
  readonly onEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onSaveEdit: (message: string) => Promise<void>;
  readonly onDelete: () => void;
}

function formatCommentTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function CommentItem({
  comment,
  isEditing = false,
  isPending = false,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: CommentItemProps) {
  const [showEditedLabel] = useState(comment.updatedAt !== comment.createdAt);

  if (isEditing) {
    return (
      <article className="rounded-lg border border-border bg-card p-4">
        <CommentComposer
          key={comment.id}
          initialMessage={comment.message}
          submitLabel="Save Changes"
          isPending={isPending}
          onCancel={onCancelEdit}
          onSubmit={onSaveEdit}
        />
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <Avatar size="sm" initials={comment.author.initials} aria-label={comment.author.name} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Caption className="font-medium text-foreground">{comment.author.name}</Caption>
              <Caption className="text-muted-foreground">
                {formatCommentTimestamp(comment.createdAt)}
                {showEditedLabel ? ' · edited' : ''}
              </Caption>
            </div>
            <Body className="whitespace-pre-wrap text-foreground">{comment.message}</Body>
          </div>
        </div>

        <Can permission="comments.manage">
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Edit comment by ${comment.author.name}`}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-danger hover:text-danger"
              aria-label={`Delete comment by ${comment.author.name}`}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </Can>
      </div>
    </article>
  );
}
