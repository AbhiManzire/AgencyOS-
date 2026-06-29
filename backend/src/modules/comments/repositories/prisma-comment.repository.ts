import { Injectable } from '@nestjs/common';
import type { Comment, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CommentEntityScope,
  CommentRecord,
  CommentRepository,
  CommentScope,
  CreateCommentData,
  SoftDeleteCommentData,
  UpdateCommentData,
} from './comment.repository.interface';

type CommentWithAuthor = Comment & {
  authorUser: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>;
};

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentData): Promise<CommentRecord> {
    const comment = await this.prisma.comment.create({
      data: {
        ...data,
        parentCommentId: data.parentCommentId ?? null,
      },
      include: authorInclude,
    });

    return toCommentRecord(comment);
  }

  async findById(scope: CommentScope, id: string): Promise<CommentRecord | null> {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
      },
      include: authorInclude,
    });

    return comment ? toCommentRecord(comment) : null;
  }

  async listByEntity(scope: CommentEntityScope): Promise<readonly CommentRecord[]> {
    const comments = await this.prisma.comment.findMany({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        entityType: scope.entityType,
        entityId: scope.entityId,
        parentCommentId: null,
        deletedAt: null,
      },
      include: authorInclude,
      orderBy: { createdAt: 'asc' },
    });

    return comments.map(toCommentRecord);
  }

  async update(
    scope: CommentScope,
    id: string,
    data: UpdateCommentData,
  ): Promise<CommentRecord | null> {
    const result = await this.prisma.comment.updateMany({
      where: activeCommentWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }

  async softDelete(
    scope: CommentScope,
    id: string,
    data: SoftDeleteCommentData,
  ): Promise<CommentRecord | null> {
    const result = await this.prisma.comment.updateMany({
      where: activeCommentWhere(scope, id),
      data,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(scope, id);
  }
}

const authorInclude = {
  authorUser: {
    select: {
      displayName: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

function activeCommentWhere(scope: CommentScope, id: string) {
  return {
    id,
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    deletedAt: null,
  };
}

function resolveUserDisplayName(
  user: Pick<User, 'displayName' | 'email' | 'firstName' | 'lastName'>,
): string {
  if (user.displayName !== null && user.displayName.trim().length > 0) {
    return user.displayName.trim();
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name.length > 0 ? name : user.email;
}

function toCommentRecord(comment: CommentWithAuthor): CommentRecord {
  return {
    id: comment.id,
    tenantId: comment.tenantId,
    workspaceId: comment.workspaceId,
    entityType: comment.entityType,
    entityId: comment.entityId,
    parentCommentId: comment.parentCommentId,
    message: comment.message,
    authorUserId: comment.authorUserId,
    authorDisplayName: resolveUserDisplayName(comment.authorUser),
    authorEmail: comment.authorUser.email,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    createdByUserId: comment.createdByUserId,
    updatedByUserId: comment.updatedByUserId,
    deletedAt: comment.deletedAt,
    deletedByUserId: comment.deletedByUserId,
  };
}
