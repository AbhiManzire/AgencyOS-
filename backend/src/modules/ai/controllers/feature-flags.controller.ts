import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiScope, FeatureFlagRecord } from '../ai.types';
import { ListFeatureFlagsQueryDto, UpsertFeatureFlagDto } from '../dto/feature-flag.dto';
import { FeatureFlagService } from '../services/feature-flag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('ai/feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  @RequirePermissions('ai.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListFeatureFlagsQueryDto,
  ): Promise<ApiSuccessResponse<readonly FeatureFlagRecord[]>> {
    const scope = this.resolveScope(headers);
    const skip = query.skip ?? 0;
    const take = Math.min(query.take ?? 25, 100);
    const result = await this.featureFlagService.list(scope, skip, take);
    return successResponse(result.items, { total: result.total, skip, take });
  }

  @Get(':key')
  @RequirePermissions('ai.read')
  async getByKey(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('key') key: string,
  ): Promise<ApiSuccessResponse<FeatureFlagRecord>> {
    const flag = await this.featureFlagService.getByKey(this.resolveScope(headers), key);
    return successResponse(flag);
  }

  @Put(':key')
  @RequirePermissions('ai.manage')
  async upsert(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('key') key: string,
    @Body() dto: UpsertFeatureFlagDto,
  ): Promise<ApiSuccessResponse<FeatureFlagRecord>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const flag = await this.featureFlagService.upsert(
      scope,
      key,
      {
        name: dto.name,
        description: dto.description ?? null,
        enabled: dto.enabled,
      },
      actorUserId,
    );
    return successResponse(flag);
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
