import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AssignUserRoleDto } from '../dto/assign-user-role.dto';
import type { UpdateCompanyProfileDto } from '../dto/update-company-profile.dto';
import type { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import type { UpdateWorkspaceSettingsDto } from '../dto/update-workspace-settings.dto';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
} from '../repositories/settings.repository.interface';
import type {
  CompanyProfile,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserRecord,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getCompanyProfile(scope: SettingsScope): Promise<CompanyProfile> {
    const profile = await this.settingsRepository.getCompanyProfile(scope);
    if (!profile) {
      throw new NotFoundException('Company profile not found.');
    }
    return profile;
  }

  async updateCompanyProfile(
    scope: SettingsScope,
    dto: UpdateCompanyProfileDto,
  ): Promise<CompanyProfile> {
    this.assertHasPatch(dto);
    return this.settingsRepository.updateCompanyProfile(scope, {
      name: dto.name,
      legalName: dto.legalName,
    });
  }

  async getWorkspaceSettings(scope: SettingsScope): Promise<WorkspaceSettings> {
    const settings = await this.settingsRepository.getWorkspaceSettings(scope);
    if (!settings) {
      throw new NotFoundException('Workspace settings not found.');
    }
    return settings;
  }

  async updateWorkspaceSettings(
    scope: SettingsScope,
    dto: UpdateWorkspaceSettingsDto,
  ): Promise<WorkspaceSettings> {
    this.assertHasPatch(dto);
    return this.settingsRepository.updateWorkspaceSettings(scope, { name: dto.name });
  }

  async getPreferences(scope: SettingsScope): Promise<WorkspacePreferences> {
    const preferences = await this.settingsRepository.getPreferences(scope);
    if (!preferences) {
      throw new NotFoundException('Workspace preferences not found.');
    }
    return preferences;
  }

  async updatePreferences(
    scope: SettingsScope,
    dto: UpdatePreferencesDto,
  ): Promise<WorkspacePreferences> {
    this.assertHasPatch(dto);
    return this.settingsRepository.updatePreferences(scope, {
      timezone: dto.timezone,
      currency: dto.currency,
    });
  }

  async listUsers(scope: SettingsScope): Promise<readonly SettingsUserRecord[]> {
    return this.settingsRepository.listUsers(scope);
  }

  async listRoles(scope: SettingsScope): Promise<readonly SettingsRoleRecord[]> {
    return this.settingsRepository.listRoles(scope);
  }

  async getRole(scope: SettingsScope, roleId: string): Promise<SettingsRoleDetail> {
    const role = await this.settingsRepository.getRoleDetail(scope, roleId);
    if (!role) {
      throw new NotFoundException('Role not found.');
    }
    return role;
  }

  async assignUserRole(
    scope: SettingsScope,
    userId: string,
    dto: AssignUserRoleDto,
  ): Promise<SettingsUserRecord> {
    await this.assertUserAndRole(scope, userId, dto.roleId);
    await this.settingsRepository.assignUserRole(scope, userId, dto.roleId);
    return this.requireUser(scope, userId);
  }

  async revokeUserRole(
    scope: SettingsScope,
    userId: string,
    roleId: string,
  ): Promise<SettingsUserRecord> {
    await this.assertUserAndRole(scope, userId, roleId);
    const revoked = await this.settingsRepository.revokeUserRole(scope, userId, roleId);
    if (!revoked) {
      throw new NotFoundException('User role assignment not found.');
    }
    return this.requireUser(scope, userId);
  }

  private async assertUserAndRole(
    scope: SettingsScope,
    userId: string,
    roleId: string,
  ): Promise<void> {
    const [userOk, roleOk] = await Promise.all([
      this.settingsRepository.userInWorkspace(scope, userId),
      this.settingsRepository.roleExists(scope, roleId),
    ]);

    if (!userOk) {
      throw new NotFoundException('User not found in this workspace.');
    }

    if (!roleOk) {
      throw new NotFoundException('Role not found.');
    }
  }

  private async requireUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    const users = await this.settingsRepository.listUsers(scope);
    const user = users.find((entry) => entry.userId === userId);
    if (!user) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return user;
  }

  private assertHasPatch(dto: object): void {
    const keys = Object.keys(dto).filter(
      (key) => (dto as Record<string, unknown>)[key] !== undefined,
    );
    if (keys.length === 0) {
      throw new BadRequestException('At least one field is required.');
    }
  }
}
