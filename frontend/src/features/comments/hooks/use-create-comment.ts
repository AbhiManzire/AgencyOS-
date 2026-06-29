import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateCommentPayload } from '@/features/comments/api/comment.types';
import { createComment } from '@/features/comments/api/comments.api';
import { invalidateEntityComments } from '@/features/comments/hooks/comments-query-keys';

export function useCreateComment(params: {
  readonly entityType: string;
  readonly entityId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      createComment({
        entityType: params.entityType,
        entityId: params.entityId,
        message,
      } satisfies CreateCommentPayload),
    onSuccess: async () => {
      await invalidateEntityComments(queryClient, params);
    },
  });
}
