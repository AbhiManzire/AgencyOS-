import { useQuery } from '@tanstack/react-query';
import { commentRecordToListItem } from '@/features/comments/api/comment.mapper';
import { listComments } from '@/features/comments/api/comments.api';
import type { EntityCommentsParams } from '@/features/comments/api/comment.types';
import { commentsQueryKeys } from '@/features/comments/hooks/comments-query-keys';

/** TanStack Query hook for GET /comments/:entityType/:entityId. */
export function useComments(params: EntityCommentsParams) {
  return useQuery({
    queryKey: commentsQueryKeys.entity(params),
    queryFn: async () => {
      const records = await listComments(params);
      return records.map(commentRecordToListItem);
    },
    enabled: params.entityType.length > 0 && params.entityId.length > 0,
  });
}
