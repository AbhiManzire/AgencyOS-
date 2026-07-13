'use client';

import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { Avatar } from '@/design-system';
import { Body, Caption } from '@/design-system/typography';
import { CommentComposer } from '@/features/comments/components/comment-composer';
import { useComments } from '@/features/comments/hooks/use-comments';
import { useCreateComment } from '@/features/comments/hooks/use-create-comment';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';
import { formatDateTime } from '@/lib/format/date';

interface ActivityCommentsProps {
  readonly activityId: string;
}

/** Post-only comments for an activity (immutable — no edit/delete). */
export function ActivityComments({ activityId }: ActivityCommentsProps) {
  const { showToast } = useToast();
  const entityParams = { entityType: 'activity', entityId: activityId };
  const { data: comments = [], isLoading, error, refetch } = useComments(entityParams);
  const { mutateAsync: createComment, isPending: isCreating } = useCreateComment(entityParams);
  const [composerOpen, setComposerOpen] = useState(false);

  const handleCreate = async (message: string): Promise<void> => {
    await createComment(message);
    showToast('Comment added successfully');
    setComposerOpen(false);
  };

  if (isLoading) {
    return <LoadingState label="Loading comments..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={extractApiErrorMessage(error)}
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <Can permission="comments.manage">
        {composerOpen ? (
          <CommentComposer
            submitLabel="Post Comment"
            isPending={isCreating}
            onCancel={() => {
              setComposerOpen(false);
            }}
            onSubmit={handleCreate}
          />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setComposerOpen(true);
            }}
          >
            Add comment
          </Button>
        )}
      </Can>

      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments"
          description="Comments on this activity will appear here."
        />
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex gap-2">
                <Avatar
                  size="sm"
                  initials={comment.author.initials}
                  aria-label={comment.author.name}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Caption className="font-medium text-foreground">{comment.author.name}</Caption>
                    <Caption className="text-muted-foreground">
                      {formatDateTime(comment.createdAt)}
                    </Caption>
                  </div>
                  <Body className="whitespace-pre-wrap text-sm text-foreground">
                    {comment.message}
                  </Body>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
