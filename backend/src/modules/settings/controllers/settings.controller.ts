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
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { UpdateCompanyProfileDto } from '../dto/update-company-profile.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { UpdateWorkspaceSettingsDto } from '../dto/update-workspace-settings.dto';
import type {
  CompanyProfile,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';
import { SettingsService } from '../services/settings.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @RequirePermissions('settings.read')
  async getCompany(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<CompanyProfile>> {
    const profile = await this.settingsService.getCompanyProfile(this.resolveScope(headers));
    return successResponse(profile);
  }

  @Patch('company')
  @RequirePermissions('settings.update')
  async updateCompany(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: UpdateCompanyProfileDto,
  ): Promise<ApiSuccessResponse<CompanyProfile>> {
    const profile = await this.settingsService.updateCompanyProfile(
      this.resolveScope(headers),
      body,
    );
    return successResponse(profile);
  }

  @Get('workspace')
  @RequirePermissions('settings.read')
  async getWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspaceSettings>> {
    const settings = await this.settingsService.getWorkspaceSettings(this.resolveScope(headers));
    return successResponse(settings);
  }

  @Patch('workspace')
  @RequirePermissions('settings.update')
  async updateWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: UpdateWorkspaceSettingsDto,
  ): Promise<ApiSuccessResponse<WorkspaceSettings>> {
    const settings = await this.settingsService.updateWorkspaceSettings(
      this.resolveScope(headers),
      body,
    );
    return successResponse(settings);
  }

  @Get('preferences')
  @RequirePermissions('settings.read')
  async getPreferences(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspacePreferences>> {
    const preferences = await this.settingsService.getPreferences(this.resolveScope(headers));
    return successResponse(preferences);
  }

  @Patch('preferences')
  @RequirePermissions('settings.update')
  async updatePreferences(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: UpdatePreferencesDto,
  ): Promise<ApiSuccessResponse<WorkspacePreferences>> {
    const preferences = await this.settingsService.updatePreferences(
      this.resolveScope(headers),
      body,
    );
    return successResponse(preferences);
  }

  @Get('users')
  @RequirePermissions('settings.read')
  async listUsers(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ items: readonly SettingsUserRecord[] }>> {
    const items = await this.settingsService.listUsers(this.resolveScope(headers));
    return successResponse({ items });
  }

  @Post('users/:userId/roles')
  @RequirePermissions('settings.update')
  async assignUserRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: AssignUserRoleDto,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.assignUserRole(
      this.resolveScope(headers),
      userId,
      body,
    );
    return successResponse(user);
  }

  @Delete('users/:userId/roles/:roleId')
  @RequirePermissions('settings.update')
  async revokeUserRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.revokeUserRole(
      this.resolveScope(headers),
      userId,
      roleId,
    );
    return successResponse(user);
  }

  @Get('roles')
  @RequirePermissions('settings.read')
  async listRoles(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<{ items: readonly SettingsRoleRecord[] }>> {
    const items = await this.settingsService.listRoles(this.resolveScope(headers));
    return successResponse({ items });
  }

  @Get('roles/:roleId')
  @RequirePermissions('settings.read')
  async getRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<ApiSuccessResponse<SettingsRoleDetail>> {
    const role = await this.settingsService.getRole(this.resolveScope(headers), roleId);
    return successResponse(role);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): SettingsScope {
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

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
