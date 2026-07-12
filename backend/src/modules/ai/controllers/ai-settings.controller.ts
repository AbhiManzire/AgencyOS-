import { BadRequestException, Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiScope, AiSettingsRecord } from '../ai.types';
import { UpdateAiSettingsDto } from '../dto/update-ai-settings.dto';
import { AiSettingsService } from '../services/ai-settings.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('ai/settings')
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  @Get()
  @RequirePermissions('ai.read')
  async getSettings(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<AiSettingsRecord>> {
    const settings = await this.aiSettingsService.getOrCreate(this.resolveScope(headers));
    return successResponse(settings);
  }

  @Patch()
  @RequirePermissions('ai.manage')
  async updateSettings(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: UpdateAiSettingsDto,
  ): Promise<ApiSuccessResponse<AiSettingsRecord>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const settings = await this.aiSettingsService.update(scope, dto, actorUserId);
    return successResponse(settings);
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
