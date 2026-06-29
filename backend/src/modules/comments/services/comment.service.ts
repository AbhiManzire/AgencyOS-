import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommentDomainService } from '../domain/comment-domain.service';
import { COMMENT_DOMAIN_ERROR_CODES, CommentDomainError } from '../domain/comment-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COMMENT_REPOSITORY,
  type CommentEntityScope,
  type CommentRepository,
  type CommentScope,
  type CreateCommentData,
  type UpdateCommentData,
} from '../repositories/comment.repository.interface';
import type {
  CommentApplicationContext,
  CommentRecord,
  CreateCommentCommand,
  UpdateCommentCommand,
} from './comment-application.types';

@Injectable()
export class CommentService {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentRepository: CommentRepository,
    private readonly commentDomainService: CommentDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listCommentsByEntity(
    scope: CommentScope,
    entityType: string,
    entityId: string,
  ): Promise<readonly CommentRecord[]> {
    const entityScope: CommentEntityScope = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: entityType.trim(),
      entityId,
    };

    return this.commentRepository.listByEntity(entityScope);
  }

  async createComment(
    scope: CommentScope,
    command: CreateCommentCommand,
    context: CommentApplicationContext,
  ): Promise<CommentRecord> {
    this.commentDomainService.validateCreate({
      message: command.message,
      parentCommentId: command.parentCommentId,
    });

    const now = new Date();
    const normalizedMessage = this.commentDomainService.normalizeMessage(command.message);

    const data: CreateCommentData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      entityType: command.entityType.trim(),
      entityId: command.entityId,
      parentCommentId: null,
      message: normalizedMessage,
      authorUserId: context.actorUserId,
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(() => this.commentRepository.create(data));
  }

  async updateComment(
    scope: CommentScope,
    commentId: string,
    command: UpdateCommentCommand,
    context: CommentApplicationContext,
  ): Promise<CommentRecord> {
    const existing = await this.requireComment(scope, commentId);

    this.commentDomainService.validateUpdate(existing, {
      message: command.message,
    });

    const now = new Date();
    const data: UpdateCommentData = {
      ...(command.message !== undefined
        ? { message: this.commentDomainService.normalizeMessage(command.message) }
        : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.runInTransaction(async () => {
      const updated = await this.commentRepository.update(scope, commentId, data);
      if (updated === null) {
        throw new CommentDomainError(
          COMMENT_DOMAIN_ERROR_CODES.COMMENT_NOT_FOUND,
          'Comment was not found.',
        );
      }

      return updated;
    });
  }

  async deleteComment(
    scope: CommentScope,
    commentId: string,
    context: CommentApplicationContext,
  ): Promise<CommentRecord> {
    const existing = await this.requireComment(scope, commentId);
    this.commentDomainService.ensureWorkspaceOwnership(scope, existing);

    const now = new Date();

    return this.runInTransaction(async () => {
      const deleted = await this.commentRepository.softDelete(scope, commentId, {
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new CommentDomainError(
          COMMENT_DOMAIN_ERROR_CODES.COMMENT_NOT_FOUND,
          'Comment was not found.',
        );
      }

      return deleted;
    });
  }

  private async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async () => work());
  }

  private async requireComment(scope: CommentScope, commentId: string): Promise<CommentRecord> {
    const comment = await this.commentRepository.findById(scope, commentId);

    if (comment?.deletedAt != null || comment == null) {
      throw new CommentDomainError(
        COMMENT_DOMAIN_ERROR_CODES.COMMENT_NOT_FOUND,
        'Comment was not found.',
      );
    }

    this.commentDomainService.ensureWorkspaceOwnership(scope, comment);
    return comment;
  }
}
