'use client';

import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState, useToast } from '@/design-system';
import { CommentComposer } from '@/features/comments/components/comment-composer';
import { CommentItem } from '@/features/comments/components/comment-item';
import { DeleteCommentDialog } from '@/features/comments/components/delete-comment-dialog';
import { useComments } from '@/features/comments/hooks/use-comments';
import { useCreateComment } from '@/features/comments/hooks/use-create-comment';
import { useDeleteComment } from '@/features/comments/hooks/use-delete-comment';
import { useUpdateComment } from '@/features/comments/hooks/use-update-comment';
import { Can } from '@/lib/rbac';
import { extractApiErrorMessage } from '@/lib/api/extract-api-error';

interface CommentsPanelProps {
  readonly entityType: string;
  readonly entityId: string;
}

export function CommentsPanel({ entityType, entityId }: CommentsPanelProps) {
  const { showToast } = useToast();
  const entityParams = { entityType, entityId };

  const { data: comments = [], isLoading, error, refetch } = useComments(entityParams);
  const { mutateAsync: createComment, isPending: isCreating } = useCreateComment(entityParams);
  const { mutateAsync: updateComment, isPending: isUpdating } = useUpdateComment(entityParams);
  const { mutateAsync: deleteComment, isPending: isDeleting } = useDeleteComment(entityParams);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const handleCreate = async (message: string): Promise<void> => {
    await createComment(message);
    showToast('Comment added successfully');
  };

  const handleSaveEdit = async (commentId: string, message: string): Promise<void> => {
    await updateComment({ commentId, message });
    showToast('Comment updated successfully');
    setEditingCommentId(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (deleteCommentId === null) {
      return;
    }

    try {
      await deleteComment(deleteCommentId);
      showToast('Comment deleted successfully');
      setDeleteCommentId(null);
    } catch (deleteError) {
      showToast(extractApiErrorMessage(deleteError), 'error');
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading comments..." />;
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
      <div>
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="text-sm text-muted-foreground">Discussion and notes for this record.</p>
      </div>

      <Can permission="comments.manage">
        <CommentComposer
          submitLabel="Post Comment"
          isPending={isCreating}
          onSubmit={handleCreate}
        />
      </Can>

      {comments.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No comments yet"
          description="Be the first to leave a comment on this record."
        />
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isEditing={editingCommentId === comment.id}
              isPending={isUpdating}
              onEdit={() => {
                setEditingCommentId(comment.id);
              }}
              onCancelEdit={() => {
                setEditingCommentId(null);
              }}
              onSaveEdit={async (message) => {
                await handleSaveEdit(comment.id, message);
              }}
              onDelete={() => {
                setDeleteCommentId(comment.id);
              }}
            />
          ))}
        </div>
      )}

      <DeleteCommentDialog
        open={deleteCommentId !== null}
        isPending={isDeleting}
        onCancel={() => {
          setDeleteCommentId(null);
        }}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
