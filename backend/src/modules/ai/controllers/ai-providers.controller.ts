import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiProviderConfigRecord, AiScope } from '../ai.types';
import { CreateAiProviderConfigDto } from '../dto/ai-provider-config.dto';
import { AiProviderConfigService } from '../services/ai-provider-config.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('ai/providers')
export class AiProvidersController {
  constructor(private readonly aiProviderConfigService: AiProviderConfigService) {}

  @Get()
  @RequirePermissions('ai.manage')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ items: readonly AiProviderConfigRecord[] }>> {
    const items = await this.aiProviderConfigService.list(this.resolveScope(headers));
    return successResponse({ items });
  }

  @Post()
  @RequirePermissions('ai.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateAiProviderConfigDto,
  ): Promise<ApiSuccessResponse<AiProviderConfigRecord>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const config = await this.aiProviderConfigService.create(scope, dto, actorUserId);
    return successResponse(config);
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
