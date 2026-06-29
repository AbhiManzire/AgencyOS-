import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteComment } from '@/features/comments/api/comments.api';
import { invalidateEntityComments } from '@/features/comments/hooks/comments-query-keys';

export function useDeleteComment(params: {
  readonly entityType: string;
  readonly entityId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: async () => {
      await invalidateEntityComments(queryClient, params);
    },
  });
}
