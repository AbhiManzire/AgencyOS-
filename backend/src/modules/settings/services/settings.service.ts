import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { EMAIL_SERVICE, type EmailService } from '../../notifications/email.service.interface';
import { RoleService } from '../../rbac/services/role.service';
import type { AcceptInvitationDto } from '../dto/accept-invitation.dto';
import type { CreateRoleDto } from '../dto/create-role.dto';
import type { InviteUserDto } from '../dto/invite-user.dto';
import type { SetRolePermissionsDto } from '../dto/set-role-permissions.dto';
import type { UpdateCompanyProfileDto } from '../dto/update-company-profile.dto';
import type { UpdatePreferencesDto } from '../dto/update-preferences.dto';
import type { UpdateRoleDto } from '../dto/update-role.dto';
import type { UpdateSystemPreferencesDto } from '../dto/update-system-preferences.dto';
import type { UpdateUserProfileDto } from '../dto/update-user-profile.dto';
import type { UpdateWorkspaceSettingsDto } from '../dto/update-workspace-settings.dto';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepository,
} from '../repositories/settings.repository.interface';
import type {
  CompanyProfile,
  ListSettingsUsersQuery,
  AcceptInvitationResult,
  SettingsEmailReadyResult,
  SettingsInvitationRecord,
  SettingsRoleDetail,
  SettingsRoleRecord,
  SettingsScope,
  SettingsUserListResult,
  SettingsUserRecord,
  SystemPreferences,
  WorkspacePreferences,
  WorkspaceSettings,
} from '../settings.types';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    private readonly roleService: RoleService,
    private readonly configService: ConfigService,
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
      logoUrl: dto.logoUrl,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      stateRegion: dto.stateRegion,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode,
      gstin: dto.gstin,
      pan: dto.pan,
      brandPrimaryColor: dto.brandPrimaryColor,
      brandSecondaryColor: dto.brandSecondaryColor,
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
    return this.settingsRepository.updateWorkspaceSettings(scope, {
      name: dto.name,
      isActive: dto.isActive,
      logoUrl: dto.logoUrl,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      stateRegion: dto.stateRegion,
      postalCode: dto.postalCode,
      countryCode: dto.countryCode,
      gstin: dto.gstin,
      pan: dto.pan,
      timezone: dto.timezone,
      currency: dto.currency,
      language: dto.language,
      dateFormat: dto.dateFormat,
      numberFormat: dto.numberFormat,
      financialYearStartMonth: dto.financialYearStartMonth,
      businessHoursStart: dto.businessHoursStart,
      businessHoursEnd: dto.businessHoursEnd,
      workingDays: dto.workingDays,
    });
  }

  async archiveWorkspace(scope: SettingsScope): Promise<WorkspaceSettings> {
    return this.settingsRepository.archiveWorkspace(scope, new Date());
  }

  async restoreWorkspace(scope: SettingsScope): Promise<WorkspaceSettings> {
    return this.settingsRepository.restoreWorkspace(scope, new Date());
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
      language: dto.language,
      dateFormat: dto.dateFormat,
      numberFormat: dto.numberFormat,
      workingDays: dto.workingDays,
      businessHoursStart: dto.businessHoursStart,
      businessHoursEnd: dto.businessHoursEnd,
      financialYearStartMonth: dto.financialYearStartMonth,
      preferencesJson: dto.preferencesJson,
    });
  }

  async getSystemPreferences(scope: SettingsScope): Promise<SystemPreferences> {
    const preferences = await this.settingsRepository.getSystemPreferences(scope);
    if (!preferences) {
      throw new NotFoundException('Workspace system preferences not found.');
    }
    return preferences;
  }

  async updateSystemPreferences(
    scope: SettingsScope,
    dto: UpdateSystemPreferencesDto,
  ): Promise<SystemPreferences> {
    this.assertHasPatch(dto);
    return this.settingsRepository.updateSystemPreferences(scope, {
      ...(dto.featureFlags !== undefined ? { featureFlags: dto.featureFlags } : {}),
      ...(dto.maintenanceMode !== undefined ? { maintenanceMode: dto.maintenanceMode } : {}),
      ...(dto.maxUploadBytes !== undefined ? { maxUploadBytes: dto.maxUploadBytes } : {}),
      ...(dto.allowedFileTypes !== undefined ? { allowedFileTypes: dto.allowedFileTypes } : {}),
      ...(dto.emailFrom !== undefined ? { emailFrom: dto.emailFrom.trim() } : {}),
      ...(dto.appVersion !== undefined ? { appVersion: dto.appVersion.trim() } : {}),
    });
  }

  async listUsers(
    scope: SettingsScope,
    query: ListSettingsUsersQuery = {},
  ): Promise<SettingsUserListResult> {
    return this.settingsRepository.listUsers(scope, query);
  }

  async inviteUser(
    scope: SettingsScope,
    dto: InviteUserDto,
    invitedByUserId?: string,
  ): Promise<SettingsInvitationRecord> {
    const email = dto.email.trim().toLowerCase();

    const existingUserId = await this.settingsRepository.findUserIdByEmailInWorkspace(scope, email);
    if (existingUserId) {
      throw new ConflictException('User already belongs to this workspace.');
    }

    if (dto.roleId) {
      const roleOk = await this.settingsRepository.roleExists(scope, dto.roleId);
      if (!roleOk) {
        throw new NotFoundException('Role not found.');
      }
    }

    const pending = await this.settingsRepository.findPendingInvitationByEmail(scope, email);
    if (pending) {
      throw new ConflictException('A pending invitation already exists for this email.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    const invitation = await this.settingsRepository.createInvitation(scope, {
      id: randomUUID(),
      email,
      roleId: dto.roleId,
      invitedByUserId,
      tokenHash,
      expiresAt,
      now,
    });

    const appOrigin = this.configService.get<string>('cors.origin', 'http://localhost:3000');
    const acceptUrl = `${appOrigin.replace(/\/$/, '')}/auth/accept-invite?token=${rawToken}`;

    await this.emailService.send({
      to: email,
      subject: 'You are invited to AgencyOS',
      html: `<p>You have been invited to join a workspace on AgencyOS.</p><p><a href="${acceptUrl}">Accept invitation</a></p><p>This invitation expires on ${expiresAt.toISOString()}.</p>`,
    });

    return invitation;
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<AcceptInvitationResult> {
    const tokenHash = createHash('sha256').update(dto.token.trim()).digest('hex');
    const invitation = await this.settingsRepository.findPendingInvitationByTokenHash(tokenHash);

    if (invitation === null) {
      throw new NotFoundException('Invitation was not found or is no longer pending.');
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invitation has expired.');
    }

    const existing = await this.settingsRepository.findUserByEmail(invitation.email);
    if (existing !== null && !existing.isActive) {
      throw new ConflictException('A deactivated account already exists for this email.');
    }

    const alreadyInWorkspace = await this.settingsRepository.findUserIdByEmailInWorkspace(
      { tenantId: invitation.tenantId, workspaceId: invitation.workspaceId },
      invitation.email,
    );
    if (alreadyInWorkspace !== null) {
      throw new ConflictException('User already belongs to this workspace.');
    }

    const userId = existing?.id ?? randomUUID();
    const now = new Date();
    const result = await this.settingsRepository.acceptInvitation({
      invitationId: invitation.id,
      userId,
      tenantId: invitation.tenantId,
      workspaceId: invitation.workspaceId,
      roleId: invitation.roleId,
      email: invitation.email,
      firstName: dto.firstName?.trim() ? dto.firstName.trim() : null,
      lastName: dto.lastName?.trim() ? dto.lastName.trim() : null,
      displayName: dto.displayName?.trim() ? dto.displayName.trim() : null,
      keycloakSubject: `invite:${userId}`,
      now,
    });

    return {
      userId: result.userId,
      email: invitation.email,
      tenantId: invitation.tenantId,
      workspaceId: invitation.workspaceId,
      createdUser: result.createdUser,
    };
  }

  async updateUserProfile(
    scope: SettingsScope,
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<SettingsUserRecord> {
    this.assertHasPatch(dto);
    await this.assertUserInWorkspace(scope, userId);

    if (dto.departmentId) {
      const deptOk = await this.settingsRepository.departmentExists(scope, dto.departmentId);
      if (!deptOk) {
        throw new NotFoundException('Department not found.');
      }
    }

    if (dto.managerUserId) {
      if (dto.managerUserId === userId) {
        throw new BadRequestException('A user cannot be their own manager.');
      }
      const managerOk = await this.settingsRepository.userInWorkspace(scope, dto.managerUserId);
      if (!managerOk) {
        throw new NotFoundException('Manager not found in this workspace.');
      }
    }

    return this.settingsRepository.updateUserProfile(scope, userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      jobTitle: dto.jobTitle,
      departmentId: dto.departmentId,
      managerUserId: dto.managerUserId,
    });
  }

  async deactivateUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    await this.assertUserInWorkspace(scope, userId);
    return this.settingsRepository.deactivateUser(scope, userId, new Date());
  }

  async reactivateUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    await this.assertUserInWorkspace(scope, userId);
    return this.settingsRepository.reactivateUser(scope, userId, new Date());
  }

  async archiveUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    await this.assertUserInWorkspace(scope, userId);
    return this.settingsRepository.archiveUser(scope, userId, new Date());
  }

  async restoreUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    const exists = await this.settingsRepository.userInWorkspaceIncludingArchived(scope, userId);
    if (!exists) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return this.settingsRepository.restoreUser(scope, userId, new Date());
  }

  async unlockUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    await this.assertUserInWorkspace(scope, userId);
    return this.settingsRepository.unlockUser(scope, userId, new Date());
  }

  async resetPassword(scope: SettingsScope, userId: string): Promise<SettingsEmailReadyResult> {
    const user = await this.settingsRepository.getUser(scope, userId);
    if (!user) {
      throw new NotFoundException('User not found in this workspace.');
    }

    const result = await this.emailService.send({
      to: user.email,
      subject: 'AgencyOS password reset',
      html: `<p>A password reset was requested for your AgencyOS account (${user.email}).</p><p>Complete the reset through your identity provider when available.</p>`,
    });

    return {
      emailReady: true,
      messageId: result.messageId,
    };
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

  async createRole(scope: SettingsScope, dto: CreateRoleDto): Promise<SettingsRoleDetail> {
    const created = await this.roleService.createCustomRole(scope.tenantId, {
      name: dto.name,
      description: dto.description,
    });
    return this.getRole(scope, created.id);
  }

  async updateRole(
    scope: SettingsScope,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<SettingsRoleDetail> {
    this.assertHasPatch(dto);
    await this.roleService.updateRole(scope.tenantId, roleId, {
      name: dto.name,
      description: dto.description,
    });
    return this.getRole(scope, roleId);
  }

  async deleteRole(scope: SettingsScope, roleId: string): Promise<void> {
    await this.roleService.softDeleteRole(scope.tenantId, roleId);
  }

  async setRolePermissions(
    scope: SettingsScope,
    roleId: string,
    dto: SetRolePermissionsDto,
  ): Promise<SettingsRoleDetail> {
    await this.roleService.setRolePermissions(scope.tenantId, roleId, dto.permissionIds);
    return this.getRole(scope, roleId);
  }

  async assignUserRole(
    scope: SettingsScope,
    userId: string,
    roleId: string,
  ): Promise<SettingsUserRecord> {
    await this.assertUserAndRole(scope, userId, roleId);
    await this.settingsRepository.assignUserRole(scope, userId, roleId);
    return this.requireUser(scope, userId);
  }

  async revokeUserRole(
    scope: SettingsScope,
    userId: string,
    roleId: string,
  ): Promise<SettingsUserRecord> {
    await this.assertUserAndRole(scope, userId, roleId);
    await this.roleService.assertCanRevokeRole(scope.tenantId, scope.workspaceId, userId, roleId);
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

  private async assertUserInWorkspace(scope: SettingsScope, userId: string): Promise<void> {
    const userOk = await this.settingsRepository.userInWorkspace(scope, userId);
    if (!userOk) {
      throw new NotFoundException('User not found in this workspace.');
    }
  }

  private async requireUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord> {
    const user = await this.settingsRepository.getUser(scope, userId);
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
