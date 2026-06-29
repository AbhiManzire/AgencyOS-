/** Comment row returned by the comments API. */
export interface CommentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly parentCommentId: string | null;
  readonly message: string;
  readonly authorUserId: string;
  readonly authorDisplayName: string | null;
  readonly authorEmail: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: string | null;
  readonly deletedByUserId: string | null;
}

export interface CreateCommentPayload {
  readonly entityType: string;
  readonly entityId: string;
  readonly message: string;
}

export interface UpdateCommentPayload {
  readonly message: string;
}

export interface EntityCommentsParams {
  readonly entityType: string;
  readonly entityId: string;
}
