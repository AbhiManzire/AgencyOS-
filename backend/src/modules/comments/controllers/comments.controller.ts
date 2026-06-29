import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentMapper } from '../mappers/comment.mapper';
import type { CommentRecord } from '../repositories/comment.repository.interface';
import type {
  CommentApplicationContext,
  CommentScope,
} from '../services/comment-application.types';
import { CommentService } from '../services/comment.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':entityType/:entityId')
  @RequirePermissions('comments.read')
  async listByEntity(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<ApiSuccessResponse<readonly CommentRecord[]>> {
    const scope = this.resolveScope(headers);
    const comments = await this.commentService.listCommentsByEntity(scope, entityType, entityId);

    return successResponse(comments);
  }

  @Post()
  @RequirePermissions('comments.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateCommentDto,
  ): Promise<ApiSuccessResponse<CommentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = CommentMapper.toCreateCommentCommand(dto);
    const comment = await this.commentService.createComment(scope, command, context);

    return successResponse(comment);
  }

  @Patch(':id')
  @RequirePermissions('comments.manage')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<ApiSuccessResponse<CommentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = CommentMapper.toUpdateCommentCommand(dto);
    const comment = await this.commentService.updateComment(scope, id, command, context);

    return successResponse(comment);
  }

  @Delete(':id')
  @RequirePermissions('comments.manage')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<CommentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const comment = await this.commentService.deleteComment(scope, id, context);

    return successResponse(comment);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): CommentScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): CommentApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
