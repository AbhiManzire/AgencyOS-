import { Module } from '@nestjs/common';
import { CommentsController } from './controllers/comments.controller';
import { CommentDomainService } from './domain/comment-domain.service';
import { PrismaCommentRepository } from './repositories/prisma-comment.repository';
import { COMMENT_REPOSITORY } from './repositories/comment.repository.interface';
import { CommentService } from './services/comment.service';

@Module({
  providers: [
    {
      provide: COMMENT_REPOSITORY,
      useClass: PrismaCommentRepository,
    },
    CommentDomainService,
    CommentService,
  ],
  controllers: [CommentsController],
  exports: [COMMENT_REPOSITORY, CommentDomainService, CommentService],
})
export class CommentsModule {}
