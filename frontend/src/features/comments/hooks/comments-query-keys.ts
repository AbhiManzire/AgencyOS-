import type { EntityCommentsParams } from '@/features/comments/api/comment.types';

export const commentsQueryKeys = {
  all: ['comments'] as const,
  entity: (params: EntityCommentsParams) =>
    [...commentsQueryKeys.all, params.entityType, params.entityId] as const,
};

export function invalidateEntityComments(
  queryClient: import('@tanstack/react-query').QueryClient,
  params: EntityCommentsParams,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: commentsQueryKeys.entity(params) });
}
