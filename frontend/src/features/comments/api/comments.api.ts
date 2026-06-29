import { apiClient } from '@/lib/api/api-client';
import type { ApiSuccessResponse } from '@/lib/api/api-response.types';
import type {
  CommentRecord,
  CreateCommentPayload,
  EntityCommentsParams,
  UpdateCommentPayload,
} from '@/features/comments/api/comment.types';

/** Fetches comments for an entity. */
export async function listComments({
  entityType,
  entityId,
}: EntityCommentsParams): Promise<readonly CommentRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<readonly CommentRecord[]>>(
    `/comments/${entityType}/${entityId}`,
  );
  return response.data.data;
}

/** Creates a comment on an entity. */
export async function createComment(payload: CreateCommentPayload): Promise<CommentRecord> {
  const response = await apiClient.post<ApiSuccessResponse<CommentRecord>>('/comments', payload);
  return response.data.data;
}

/** Updates a comment by id. */
export async function updateComment(
  commentId: string,
  payload: UpdateCommentPayload,
): Promise<CommentRecord> {
  const response = await apiClient.patch<ApiSuccessResponse<CommentRecord>>(
    `/comments/${commentId}`,
    payload,
  );
  return response.data.data;
}

/** Soft-deletes a comment by id. */
export async function deleteComment(commentId: string): Promise<CommentRecord> {
  const response = await apiClient.delete<ApiSuccessResponse<CommentRecord>>(
    `/comments/${commentId}`,
  );
  return response.data.data;
}
