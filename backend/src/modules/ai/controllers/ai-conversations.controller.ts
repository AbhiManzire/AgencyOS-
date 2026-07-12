import { BadRequestException, Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiConversationRecord, AiScope } from '../ai.types';
import { CreateAiConversationDto, ListAiConversationsQueryDto } from '../dto/ai-conversation.dto';
import { ConversationService } from '../services/conversation.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('ai/conversations')
export class AiConversationsController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @RequirePermissions('ai.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListAiConversationsQueryDto,
  ): Promise<ApiSuccessResponse<readonly AiConversationRecord[]>> {
    const scope = this.resolveScope(headers);
    const ownerUserId = this.resolveOptionalUserId(headers);
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 25, 100);
    const result = await this.conversationService.list(
      scope,
      ownerUserId,
      skip,
      take,
      query.status,
    );
    return successResponse(result.items, { total: result.total, skip, take });
  }

  @Post()
  @RequirePermissions('ai.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateAiConversationDto,
  ): Promise<ApiSuccessResponse<AiConversationRecord>> {
    const scope = this.resolveScope(headers);
    const ownerUserId = this.resolveUserId(headers);
    const actorUserId = ownerUserId;
    const conversation = await this.conversationService.create(
      scope,
      ownerUserId,
      dto,
      actorUserId,
    );
    return successResponse(conversation);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): AiScope {
    const tenantId = this.readHeader(headers, TENANT_HEADER);
    const workspaceId = this.readHeader(headers, WORKSPACE_HEADER);

    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" must be a valid UUID.`);
    }
    if (!isUUID(workspaceId)) {
      throw new BadRequestException(`Header "${WORKSPACE_HEADER}" must be a valid UUID.`);
    }

    return { tenantId, workspaceId };
  }

  private resolveUserId(headers: Record<string, string | string[] | undefined>): string {
    const userId = this.readHeader(headers, USER_HEADER);
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return userId;
  }

  private resolveOptionalUserId(
    headers: Record<string, string | string[] | undefined>,
  ): string | null {
    const userId = this.readHeader(headers, USER_HEADER);
    if (userId === '') {
      return null;
    }
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return userId;
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
