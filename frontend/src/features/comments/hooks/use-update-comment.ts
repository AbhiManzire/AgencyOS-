import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateComment } from '@/features/comments/api/comments.api';
import { invalidateEntityComments } from '@/features/comments/hooks/comments-query-keys';

interface UpdateCommentVariables {
  readonly commentId: string;
  readonly message: string;
}

export function useUpdateComment(params: {
  readonly entityType: string;
  readonly entityId: string;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, message }: UpdateCommentVariables) =>
      updateComment(commentId, { message }),
    onSuccess: async () => {
      await invalidateEntityComments(queryClient, params);
    },
  });
}
