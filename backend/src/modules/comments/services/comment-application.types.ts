import type { CommentRecord, CommentScope } from '../repositories/comment.repository.interface';

export interface CommentApplicationContext {
  readonly actorUserId: string;
}

export interface CreateCommentCommand {
  readonly entityType: string;
  readonly entityId: string;
  readonly parentCommentId?: string | null;
  readonly message: string;
}

export interface UpdateCommentCommand {
  readonly message?: string;
}

export type { CommentRecord, CommentScope };
