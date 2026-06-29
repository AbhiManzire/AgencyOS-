import type { CreateCommentDto } from '../dto/create-comment.dto';
import type { UpdateCommentDto } from '../dto/update-comment.dto';
import type {
  CreateCommentCommand,
  UpdateCommentCommand,
} from '../services/comment-application.types';

export const CommentMapper = {
  toCreateCommentCommand(dto: CreateCommentDto): CreateCommentCommand {
    return {
      entityType: dto.entityType,
      entityId: dto.entityId,
      parentCommentId: dto.parentCommentId,
      message: dto.message,
    };
  },

  toUpdateCommentCommand(dto: UpdateCommentDto): UpdateCommentCommand {
    return {
      message: dto.message,
    };
  },
};
