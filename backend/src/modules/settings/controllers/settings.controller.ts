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
  Put,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { SetRolePermissionsDto } from '../dto/set-role-permissions.dto';
import { UpdateCompanyProfileDto } from '../dto/update-company-profile.dto';
import { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { UpdateSystemPreferencesDto } from '../dto/update-system-preferences.dto';
import { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import { UpdateWorkspaceSettingsDto } from '../dto/update-workspace-settings.dto';
import type {
  CompanyProfile,
  SettingsEmailReadyResult,
  SettingsInvitationRecord,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserRecord,
  SystemPreferences,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';
import { SettingsService } from '../services/settings.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

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

  @Post('workspace/archive')
  @RequirePermissions('settings.update')
  async archiveWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspaceSettings>> {
    const settings = await this.settingsService.archiveWorkspace(this.resolveScope(headers));
    return successResponse(settings);
  }

  @Post('workspace/restore')
  @RequirePermissions('settings.update')
  async restoreWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspaceSettings>> {
    const settings = await this.settingsService.restoreWorkspace(this.resolveScope(headers));
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

  @Get('system')
  @RequirePermissions('settings.read')
  async getSystem(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<SystemPreferences>> {
    const preferences = await this.settingsService.getSystemPreferences(this.resolveScope(headers));
    return successResponse(preferences);
  }

  @Patch('system')
  @RequirePermissions('settings.update')
  async updateSystem(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: UpdateSystemPreferencesDto,
  ): Promise<ApiSuccessResponse<SystemPreferences>> {
    const preferences = await this.settingsService.updateSystemPreferences(
      this.resolveScope(headers),
      body,
    );
    return successResponse(preferences);
  }

  @Get('users')
  @RequirePermissions('settings.read')
  async listUsers(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListUsersQueryDto,
  ): Promise<ApiSuccessResponse<{ items: readonly SettingsUserRecord[] }>> {
    const result = await this.settingsService.listUsers(this.resolveScope(headers), {
      search: query.search,
      status: query.status,
      skip: query.skip,
      take: query.take,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    });
    return successResponse(
      { items: result.items },
      {
        total: result.total,
        skip: query.skip ?? 0,
        take: query.take ?? 50,
      },
    );
  }

  @Post('users/invite')
  @RequirePermissions('users.manage')
  async inviteUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: InviteUserDto,
  ): Promise<ApiSuccessResponse<SettingsInvitationRecord>> {
    const invitation = await this.settingsService.inviteUser(
      this.resolveScope(headers),
      body,
      this.readOptionalUserId(headers),
    );
    return successResponse(invitation);
  }

  @Patch('users/:userId')
  @RequirePermissions('users.manage')
  async updateUserProfile(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: UpdateUserProfileDto,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.updateUserProfile(
      this.resolveScope(headers),
      userId,
      body,
    );
    return successResponse(user);
  }

  @Post('users/:userId/deactivate')
  @RequirePermissions('users.manage')
  async deactivateUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.deactivateUser(this.resolveScope(headers), userId);
    return successResponse(user);
  }

  @Post('users/:userId/reactivate')
  @RequirePermissions('users.manage')
  async reactivateUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.reactivateUser(this.resolveScope(headers), userId);
    return successResponse(user);
  }

  @Post('users/:userId/archive')
  @RequirePermissions('users.manage')
  async archiveUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.archiveUser(this.resolveScope(headers), userId);
    return successResponse(user);
  }

  @Post('users/:userId/restore')
  @RequirePermissions('users.manage')
  async restoreUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.restoreUser(this.resolveScope(headers), userId);
    return successResponse(user);
  }

  @Post('users/:userId/unlock')
  @RequirePermissions('users.manage')
  async unlockUser(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsUserRecord>> {
    const user = await this.settingsService.unlockUser(this.resolveScope(headers), userId);
    return successResponse(user);
  }

  @Post('users/:userId/reset-password')
  @RequirePermissions('users.manage')
  async resetPassword(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<SettingsEmailReadyResult>> {
    const result = await this.settingsService.resetPassword(this.resolveScope(headers), userId);
    return successResponse(result);
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
      body.roleId,
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

  @Post('roles')
  @RequirePermissions('roles.manage')
  async createRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: CreateRoleDto,
  ): Promise<ApiSuccessResponse<SettingsRoleDetail>> {
    const role = await this.settingsService.createRole(this.resolveScope(headers), body);
    return successResponse(role);
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles.manage')
  async updateRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: UpdateRoleDto,
  ): Promise<ApiSuccessResponse<SettingsRoleDetail>> {
    const role = await this.settingsService.updateRole(this.resolveScope(headers), roleId, body);
    return successResponse(role);
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles.manage')
  async deleteRole(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<ApiSuccessResponse<{ deleted: true }>> {
    await this.settingsService.deleteRole(this.resolveScope(headers), roleId);
    return successResponse({ deleted: true });
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('roles.manage')
  async setRolePermissions(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() body: SetRolePermissionsDto,
  ): Promise<ApiSuccessResponse<SettingsRoleDetail>> {
    const role = await this.settingsService.setRolePermissions(
      this.resolveScope(headers),
      roleId,
      body,
    );
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

  private readOptionalUserId(
    headers: Record<string, string | string[] | undefined>,
  ): string | undefined {
    const userId = this.readHeader(headers, USER_HEADER);
    return isUUID(userId) ? userId : undefined;
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
