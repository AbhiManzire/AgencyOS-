import type { CommentRecord, CommentScope } from '../repositories/comment.repository.interface';
import { COMMENT_DOMAIN_ERROR_CODES, CommentDomainError } from './comment-domain.errors';
import type {
  CreateCommentValidationInput,
  UpdateCommentValidationInput,
} from './comment-domain.types';

const MAX_MESSAGE_LENGTH = 5000;

export class CommentDomainService {
  validateCreate(input: CreateCommentValidationInput): void {
    this.assertMessageRequired(input.message);

    if (input.parentCommentId !== undefined && input.parentCommentId !== null) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.THREAD_REPLIES_NOT_SUPPORTED,
        'Thread replies are not supported yet.',
      );
    }
  }

  validateUpdate(comment: CommentRecord, input: UpdateCommentValidationInput): void {
    this.assertCommentIsActive(comment);

    if (input.message !== undefined) {
      this.assertMessageRequired(input.message);
    }
  }

  ensureWorkspaceOwnership(scope: CommentScope, comment: CommentRecord): void {
    if (comment.tenantId !== scope.tenantId || comment.workspaceId !== scope.workspaceId) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.WORKSPACE_OWNERSHIP_MISMATCH,
        'Comment does not belong to the requested workspace.',
      );
    }
  }

  normalizeMessage(message: string): string {
    return message.trim();
  }

  private assertMessageRequired(message: string): void {
    const normalized = message.trim();

    if (normalized.length === 0) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.COMMENT_MESSAGE_REQUIRED,
        'Comment message is required.',
      );
    }

    if (normalized.length > MAX_MESSAGE_LENGTH) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.COMMENT_MESSAGE_REQUIRED,
        `Comment message must be ${String(MAX_MESSAGE_LENGTH)} characters or fewer.`,
      );
    }
  }

  private assertCommentIsActive(comment: CommentRecord): void {
    if (comment.deletedAt !== null) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.COMMENT_ARCHIVED,
        'Comment is archived and cannot be modified.',
      );
    }
  }
}
