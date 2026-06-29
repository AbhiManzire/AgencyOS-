export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface CommentScope {
  readonly tenantId: string;
  readonly workspaceId: string;
}

export interface CommentEntityScope extends CommentScope {
  readonly entityType: string;
  readonly entityId: string;
}

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
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId: string | null;
  readonly updatedByUserId: string | null;
  readonly deletedAt: Date | null;
  readonly deletedByUserId: string | null;
}

export interface CreateCommentData {
  readonly id: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly parentCommentId?: string | null;
  readonly message: string;
  readonly authorUserId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdByUserId?: string | null;
  readonly updatedByUserId?: string | null;
}

export interface UpdateCommentData {
  readonly message?: string;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface SoftDeleteCommentData {
  readonly deletedAt: Date;
  readonly deletedByUserId?: string | null;
  readonly updatedAt: Date;
  readonly updatedByUserId?: string | null;
}

export interface CommentRepository {
  create(data: CreateCommentData): Promise<CommentRecord>;
  findById(scope: CommentScope, id: string): Promise<CommentRecord | null>;
  listByEntity(scope: CommentEntityScope): Promise<readonly CommentRecord[]>;
  update(scope: CommentScope, id: string, data: UpdateCommentData): Promise<CommentRecord | null>;
  softDelete(
    scope: CommentScope,
    id: string,
    data: SoftDeleteCommentData,
  ): Promise<CommentRecord | null>;
}
