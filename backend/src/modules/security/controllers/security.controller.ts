import {
  BadRequestException,
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
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreatePersonalAccessTokenDto } from '../dto/create-personal-access-token.dto';
import { UpdateSecuritySettingsDto } from '../dto/update-security-settings.dto';
import type {
  CreatedPersonalAccessToken,
  LockedUserResult,
  PersonalAccessTokenRecord,
  SecurityScope,
  SecuritySettings,
  UnlockedUserResult,
} from '../security.types';
import { SecurityService } from '../services/security.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('settings')
  @RequirePermissions('settings.read')
  async getSettings(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<SecuritySettings>> {
    const settings = await this.securityService.getSettings(this.resolveScope(headers));
    return successResponse(settings);
  }

  @Patch('settings')
  @RequirePermissions('security.manage')
  async updateSettings(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: UpdateSecuritySettingsDto,
  ): Promise<ApiSuccessResponse<SecuritySettings>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const settings = await this.securityService.updateSettings(scope, dto, actorUserId);
    return successResponse(settings);
  }

  @Get('tokens')
  @RequirePermissions('security.manage')
  async listTokens(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ items: readonly PersonalAccessTokenRecord[] }>> {
    const scope = this.resolveScope(headers);
    const userId = this.resolveUserId(headers);
    const items = await this.securityService.listTokens(scope, userId);
    return successResponse({ items });
  }

  @Post('tokens')
  @RequirePermissions('security.manage')
  async createToken(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreatePersonalAccessTokenDto,
  ): Promise<ApiSuccessResponse<CreatedPersonalAccessToken>> {
    const scope = this.resolveScope(headers);
    const userId = this.resolveUserId(headers);
    const token = await this.securityService.createToken(scope, userId, dto);
    return successResponse(token);
  }

  @Delete('tokens/:id')
  @RequirePermissions('security.manage')
  async revokeToken(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PersonalAccessTokenRecord>> {
    const scope = this.resolveScope(headers);
    const userId = this.resolveUserId(headers);
    const revoked = await this.securityService.revokeToken(scope, userId, id);
    return successResponse(revoked);
  }

  @Post('users/:userId/lock')
  @RequirePermissions('security.manage')
  async lockUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<LockedUserResult>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const result = await this.securityService.lockUser(scope, userId, actorUserId);
    return successResponse(result);
  }

  @Post('users/:userId/unlock')
  @RequirePermissions('security.manage')
  async unlockUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<UnlockedUserResult>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveOptionalUserId(headers);
    const result = await this.securityService.unlockUser(scope, userId, actorUserId);
    return successResponse(result);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): SecurityScope {
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
