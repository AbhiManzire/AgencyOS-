import { Injectable, NotFoundException } from '@nestjs/common';
import { EmploymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CompanyProfile,
  ListSettingsUsersQuery,
  PreferenceCategories,
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
import { DEFAULT_SYSTEM_PREFERENCES } from '../settings.types';
import type {
  CompanyProfilePatch,
  CreateInvitationInput,
  SettingsRepository,
  UserProfilePatch,
  WorkspacePreferencesPatch,
  WorkspaceSettingsPatch,
} from './settings.repository.interface';

const PREFERENCE_CATEGORY_KEYS = [
  'branding',
  'invoice',
  'finance',
  'sales',
  'task',
  'project',
  'notification',
  'email',
  'security',
  'system',
] as const;

@Injectable()
export class PrismaSettingsRepository implements SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyProfile(scope: SettingsScope): Promise<CompanyProfile | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return toCompanyProfile(workspace.agency);
  }

  async updateCompanyProfile(
    scope: SettingsScope,
    patch: CompanyProfilePatch,
  ): Promise<CompanyProfile> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      throw new NotFoundException('Workspace not found.');
    }

    const agency = await this.prisma.agency.update({
      where: { id: workspace.agency.id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.legalName !== undefined ? { legalName: patch.legalName } : {}),
        ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl } : {}),
        ...(patch.addressLine1 !== undefined ? { addressLine1: patch.addressLine1 } : {}),
        ...(patch.addressLine2 !== undefined ? { addressLine2: patch.addressLine2 } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.stateRegion !== undefined ? { stateRegion: patch.stateRegion } : {}),
        ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
        ...(patch.countryCode !== undefined
          ? { countryCode: patch.countryCode?.toUpperCase() ?? null }
          : {}),
        ...(patch.gstin !== undefined ? { gstin: patch.gstin } : {}),
        ...(patch.pan !== undefined ? { pan: patch.pan } : {}),
        ...(patch.brandPrimaryColor !== undefined
          ? { brandPrimaryColor: patch.brandPrimaryColor }
          : {}),
        ...(patch.brandSecondaryColor !== undefined
          ? { brandSecondaryColor: patch.brandSecondaryColor }
          : {}),
        updatedAt: new Date(),
      },
    });

    return toCompanyProfile(agency);
  }

  async getWorkspaceSettings(scope: SettingsScope): Promise<WorkspaceSettings | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return toWorkspaceSettings(workspace);
  }

  async updateWorkspaceSettings(
    scope: SettingsScope,
    patch: WorkspaceSettingsPatch,
  ): Promise<WorkspaceSettings> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
        ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl } : {}),
        ...(patch.addressLine1 !== undefined ? { addressLine1: patch.addressLine1 } : {}),
        ...(patch.addressLine2 !== undefined ? { addressLine2: patch.addressLine2 } : {}),
        ...(patch.city !== undefined ? { city: patch.city } : {}),
        ...(patch.stateRegion !== undefined ? { stateRegion: patch.stateRegion } : {}),
        ...(patch.postalCode !== undefined ? { postalCode: patch.postalCode } : {}),
        ...(patch.countryCode !== undefined
          ? { countryCode: patch.countryCode?.toUpperCase() ?? null }
          : {}),
        ...(patch.gstin !== undefined ? { gstin: patch.gstin } : {}),
        ...(patch.pan !== undefined ? { pan: patch.pan } : {}),
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
        ...(patch.currency !== undefined ? { currency: patch.currency.toUpperCase() } : {}),
        ...(patch.language !== undefined ? { language: patch.language } : {}),
        ...(patch.dateFormat !== undefined ? { dateFormat: patch.dateFormat } : {}),
        ...(patch.numberFormat !== undefined ? { numberFormat: patch.numberFormat } : {}),
        ...(patch.financialYearStartMonth !== undefined
          ? { financialYearStartMonth: patch.financialYearStartMonth }
          : {}),
        ...(patch.businessHoursStart !== undefined
          ? { businessHoursStart: patch.businessHoursStart }
          : {}),
        ...(patch.businessHoursEnd !== undefined
          ? { businessHoursEnd: patch.businessHoursEnd }
          : {}),
        ...(patch.workingDays !== undefined ? { workingDays: patch.workingDays } : {}),
        updatedAt: new Date(),
      },
      include: { agency: true },
    });

    return toWorkspaceSettings(workspace);
  }

  async archiveWorkspace(scope: SettingsScope, now: Date): Promise<WorkspaceSettings> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        deletedAt: now,
        updatedAt: now,
      },
      include: { agency: true },
    });

    return toWorkspaceSettings(workspace);
  }

  async restoreWorkspace(scope: SettingsScope, now: Date): Promise<WorkspaceSettings> {
    const existing = await this.findWorkspaceIncludingDeleted(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    if (existing.deletedAt === null && existing.isActive) {
      return toWorkspaceSettings(existing);
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        isActive: true,
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: now,
      },
      include: { agency: true },
    });

    return toWorkspaceSettings(workspace);
  }

  async getPreferences(scope: SettingsScope): Promise<WorkspacePreferences | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return toWorkspacePreferences(workspace);
  }

  async updatePreferences(
    scope: SettingsScope,
    patch: WorkspacePreferencesPatch,
  ): Promise<WorkspacePreferences> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const mergedPreferences =
      patch.preferencesJson !== undefined
        ? mergePreferenceCategories(
            parsePreferenceCategories(existing.preferencesJson),
            patch.preferencesJson,
          )
        : undefined;

    const workspace = await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
        ...(patch.currency !== undefined ? { currency: patch.currency.toUpperCase() } : {}),
        ...(patch.language !== undefined ? { language: patch.language } : {}),
        ...(patch.dateFormat !== undefined ? { dateFormat: patch.dateFormat } : {}),
        ...(patch.numberFormat !== undefined ? { numberFormat: patch.numberFormat } : {}),
        ...(patch.workingDays !== undefined ? { workingDays: patch.workingDays } : {}),
        ...(patch.businessHoursStart !== undefined
          ? { businessHoursStart: patch.businessHoursStart }
          : {}),
        ...(patch.businessHoursEnd !== undefined
          ? { businessHoursEnd: patch.businessHoursEnd }
          : {}),
        ...(patch.financialYearStartMonth !== undefined
          ? { financialYearStartMonth: patch.financialYearStartMonth }
          : {}),
        ...(mergedPreferences !== undefined
          ? { preferencesJson: mergedPreferences as Prisma.InputJsonValue }
          : {}),
        updatedAt: new Date(),
      },
    });

    return toWorkspacePreferences(workspace);
  }

  async getSystemPreferences(scope: SettingsScope): Promise<SystemPreferences | null> {
    const workspace = await this.findWorkspace(scope);
    if (!workspace) {
      return null;
    }

    return parseSystemPreferences(workspace.preferencesJson);
  }

  async updateSystemPreferences(
    scope: SettingsScope,
    patch: Partial<SystemPreferences>,
  ): Promise<SystemPreferences> {
    const existing = await this.findWorkspace(scope);
    if (!existing) {
      throw new NotFoundException('Workspace not found.');
    }

    const categories = parsePreferenceCategories(existing.preferencesJson);
    const current = parseSystemPreferences(existing.preferencesJson);
    const next: SystemPreferences = {
      featureFlags: patch.featureFlags ?? current.featureFlags,
      maintenanceMode: patch.maintenanceMode ?? current.maintenanceMode,
      maxUploadBytes: patch.maxUploadBytes ?? current.maxUploadBytes,
      allowedFileTypes: patch.allowedFileTypes ?? current.allowedFileTypes,
      emailFrom: patch.emailFrom ?? current.emailFrom,
      appVersion: patch.appVersion ?? current.appVersion,
    };

    const mergedCategories: PreferenceCategories = {
      ...categories,
      system: systemPreferencesToRecord(next),
    };

    await this.prisma.workspace.update({
      where: { id: existing.id },
      data: {
        preferencesJson: mergedCategories as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return next;
  }

  async listUsers(
    scope: SettingsScope,
    query: ListSettingsUsersQuery = {},
  ): Promise<SettingsUserListResult> {
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const sortBy = query.sortBy ?? 'email';
    const sortDir = query.sortDir ?? 'asc';

    const where: Prisma.EmployeeWhereInput = {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      deletedAt: null,
      user: {
        deletedAt: null,
        ...(query.search
          ? {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' } },
                { displayName: { contains: query.search, mode: 'insensitive' } },
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      ...(query.status && isEmploymentStatus(query.status) ? { status: query.status } : {}),
    };

    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              isActive: true,
              deletedAt: true,
              lastLoginAt: true,
              lockedUntil: true,
            },
          },
          department: {
            select: { id: true, name: true },
          },
          managerUser: {
            select: {
              id: true,
              displayName: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: buildUserOrderBy(sortBy, sortDir),
        skip,
        take,
      }),
    ]);

    const items = await this.mapEmployeesToUserRecords(scope, employees);
    return { items, total };
  }

  async getUser(scope: SettingsScope, userId: string): Promise<SettingsUserRecord | null> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
        user: { deletedAt: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
            deletedAt: true,
            lastLoginAt: true,
            lockedUntil: true,
          },
        },
        department: {
          select: { id: true, name: true },
        },
        managerUser: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      return null;
    }

    const records = await this.mapEmployeesToUserRecords(scope, [employee]);
    if (records.length === 0) {
      return null;
    }
    return records[0];
  }

  async updateUserProfile(
    scope: SettingsScope,
    userId: string,
    patch: UserProfilePatch,
  ): Promise<SettingsUserRecord> {
    const employee = await this.requireEmployee(scope, userId);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const userData: Prisma.UserUpdateInput = {
        updatedAt: now,
      };
      if (patch.firstName !== undefined) {
        userData.firstName = patch.firstName;
      }
      if (patch.lastName !== undefined) {
        userData.lastName = patch.lastName;
      }
      if (patch.displayName !== undefined) {
        userData.displayName = patch.displayName;
      }
      if (patch.avatarUrl !== undefined) {
        userData.avatarUrl = patch.avatarUrl;
      }

      await tx.user.update({
        where: { id: userId },
        data: userData,
      });

      await tx.employee.update({
        where: { id: employee.id },
        data: {
          ...(patch.jobTitle !== undefined ? { jobTitle: patch.jobTitle } : {}),
          ...(patch.departmentId !== undefined ? { departmentId: patch.departmentId } : {}),
          ...(patch.managerUserId !== undefined ? { managerUserId: patch.managerUserId } : {}),
          updatedAt: now,
        },
      });
    });

    const updated = await this.getUser(scope, userId);
    if (!updated) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return updated;
  }

  async deactivateUser(
    scope: SettingsScope,
    userId: string,
    now: Date,
  ): Promise<SettingsUserRecord> {
    const employee = await this.requireEmployee(scope, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employee.id },
        data: {
          isActive: false,
          status: 'TERMINATED',
          updatedAt: now,
        },
      });

      const otherActive = await tx.employee.count({
        where: {
          userId,
          deletedAt: null,
          isActive: true,
          id: { not: employee.id },
        },
      });

      if (otherActive === 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            isActive: false,
            updatedAt: now,
          },
        });
      }
    });

    const updated = await this.getUser(scope, userId);
    if (!updated) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return updated;
  }

  async reactivateUser(
    scope: SettingsScope,
    userId: string,
    now: Date,
  ): Promise<SettingsUserRecord> {
    const employee = await this.requireEmployee(scope, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: employee.id },
        data: {
          isActive: true,
          status: 'ACTIVE',
          updatedAt: now,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: now,
        },
      });
    });

    const updated = await this.getUser(scope, userId);
    if (!updated) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return updated;
  }

  async archiveUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord> {
    const before = await this.getUser(scope, userId);
    if (!before) {
      throw new NotFoundException('User not found in this workspace.');
    }

    const employee = await this.requireEmployee(scope, userId);

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        deletedAt: now,
        isActive: false,
        updatedAt: now,
      },
    });

    return {
      ...before,
      isActive: false,
    };
  }

  async restoreUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: { not: null },
      },
      select: { id: true },
    });

    if (!employee) {
      throw new NotFoundException('Archived user not found in this workspace.');
    }

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: {
        deletedAt: null,
        deletedByUserId: null,
        isActive: true,
        status: 'ACTIVE',
        updatedAt: now,
      },
    });

    const updated = await this.getUser(scope, userId);
    if (!updated) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return updated;
  }

  async unlockUser(scope: SettingsScope, userId: string, now: Date): Promise<SettingsUserRecord> {
    await this.requireEmployee(scope, userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        failedLoginCount: 0,
        updatedAt: now,
      },
    });

    const updated = await this.getUser(scope, userId);
    if (!updated) {
      throw new NotFoundException('User not found in this workspace.');
    }
    return updated;
  }

  async findPendingInvitationByEmail(
    scope: SettingsScope,
    email: string,
  ): Promise<{ id: string } | null> {
    const invitation = await this.prisma.userInvitation.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        email: email.toLowerCase(),
        status: 'PENDING',
        deletedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    return invitation;
  }

  async createInvitation(
    scope: SettingsScope,
    input: CreateInvitationInput,
  ): Promise<SettingsInvitationRecord> {
    const invitation = await this.prisma.userInvitation.create({
      data: {
        id: input.id,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        email: input.email.toLowerCase(),
        roleId: input.roleId ?? null,
        invitedByUserId: input.invitedByUserId ?? null,
        tokenHash: input.tokenHash,
        status: 'PENDING',
        expiresAt: input.expiresAt,
        createdAt: input.now,
        updatedAt: input.now,
      },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      roleId: invitation.roleId,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      emailReady: true,
    };
  }

  async listRoles(scope: SettingsScope): Promise<readonly SettingsRoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { rolePermissions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
    }));
  }

  async getRoleDetail(scope: SettingsScope, roleId: string): Promise<SettingsRoleDetail | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
          orderBy: {
            permission: { key: 'asc' },
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions
        .filter((entry) => entry.permission.deletedAt === null)
        .map((entry) => ({
          id: entry.permission.id,
          key: entry.permission.key,
          name: entry.permission.name,
          description: entry.permission.description,
          module: entry.permission.module,
        })),
    };
  }

  async roleExists(scope: SettingsScope, roleId: string): Promise<boolean> {
    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return role !== null;
  }

  async userInWorkspace(scope: SettingsScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return employee !== null;
  }

  async userInWorkspaceIncludingArchived(scope: SettingsScope, userId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
      },
      select: { id: true },
    });

    return employee !== null;
  }

  async findUserIdByEmailInWorkspace(scope: SettingsScope, email: string): Promise<string | null> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
        user: {
          email: { equals: email, mode: 'insensitive' },
          deletedAt: null,
        },
      },
      select: { userId: true },
    });

    return employee?.userId ?? null;
  }

  async assignUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<void> {
    const now = new Date();
    await this.prisma.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId: scope.tenantId,
          userId,
          roleId,
        },
      },
      create: {
        id: randomUUID(),
        tenantId: scope.tenantId,
        userId,
        roleId,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        deletedAt: null,
        deletedByUserId: null,
        updatedAt: now,
      },
    });
  }

  async revokeUserRole(scope: SettingsScope, userId: string, roleId: string): Promise<boolean> {
    const existing = await this.prisma.userRole.findFirst({
      where: {
        tenantId: scope.tenantId,
        userId,
        roleId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      return false;
    }

    await this.prisma.userRole.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return true;
  }

  async departmentExists(scope: SettingsScope, departmentId: string): Promise<boolean> {
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return department !== null;
  }

  private async requireEmployee(
    scope: SettingsScope,
    userId: string,
  ): Promise<{ id: string; userId: string }> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        userId,
        deletedAt: null,
      },
      select: { id: true, userId: true },
    });

    if (!employee) {
      throw new NotFoundException('User not found in this workspace.');
    }

    return employee;
  }

  private async mapEmployeesToUserRecords(
    scope: SettingsScope,
    employees: readonly EmployeeWithRelations[],
  ): Promise<readonly SettingsUserRecord[]> {
    const userIds = employees.map((employee) => employee.userId);
    const assignments =
      userIds.length === 0
        ? []
        : await this.prisma.userRole.findMany({
            where: {
              tenantId: scope.tenantId,
              userId: { in: userIds },
              deletedAt: null,
              role: { deletedAt: null },
            },
            include: {
              role: {
                select: { id: true, name: true, slug: true },
              },
            },
          });

    const rolesByUser = new Map<string, SettingsUserRecord['roles'][number][]>();
    for (const assignment of assignments) {
      const list = rolesByUser.get(assignment.userId) ?? [];
      list.push({
        id: assignment.role.id,
        name: assignment.role.name,
        slug: assignment.role.slug,
      });
      rolesByUser.set(assignment.userId, list);
    }

    return employees.map((employee) => ({
      userId: employee.user.id,
      email: employee.user.email,
      displayName: resolveDisplayName(employee.user),
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      jobTitle: employee.jobTitle,
      designation: employee.jobTitle,
      avatarUrl: employee.user.avatarUrl,
      departmentId: employee.departmentId,
      departmentName: employee.department?.name ?? null,
      managerUserId: employee.managerUserId,
      managerName: employee.managerUser ? resolveDisplayName(employee.managerUser) : null,
      lastLoginAt: employee.user.lastLoginAt,
      lockedUntil: employee.user.lockedUntil,
      status: employee.status,
      isActive: employee.isActive && employee.user.isActive,
      roles: rolesByUser.get(employee.user.id) ?? [],
    }));
  }

  private async findWorkspace(scope: SettingsScope) {
    return this.prisma.workspace.findFirst({
      where: {
        id: scope.workspaceId,
        tenantId: scope.tenantId,
        deletedAt: null,
      },
      include: {
        agency: true,
      },
    });
  }

  private async findWorkspaceIncludingDeleted(scope: SettingsScope) {
    return this.prisma.workspace.findFirst({
      where: {
        id: scope.workspaceId,
        tenantId: scope.tenantId,
      },
      include: {
        agency: true,
      },
    });
  }
}

interface EmployeeWithRelations {
  userId: string;
  jobTitle: string | null;
  status: string;
  isActive: boolean;
  departmentId: string | null;
  managerUserId: string | null;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    deletedAt: Date | null;
    lastLoginAt: Date | null;
    lockedUntil: Date | null;
  };
  department: { id: string; name: string } | null;
  managerUser: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface AgencyProfileFields {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  gstin: string | null;
  pan: string | null;
  brandPrimaryColor: string | null;
  brandSecondaryColor: string | null;
}

interface WorkspacePreferenceFields {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  logoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  countryCode: string | null;
  gstin: string | null;
  pan: string | null;
  financialYearStartMonth: number;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: Prisma.JsonValue;
  language: string;
  dateFormat: string;
  numberFormat: string;
  preferencesJson: Prisma.JsonValue;
}

function toCompanyProfile(agency: AgencyProfileFields): CompanyProfile {
  return {
    agencyId: agency.id,
    name: agency.name,
    slug: agency.slug,
    legalName: agency.legalName,
    logoUrl: agency.logoUrl,
    addressLine1: agency.addressLine1,
    addressLine2: agency.addressLine2,
    city: agency.city,
    stateRegion: agency.stateRegion,
    postalCode: agency.postalCode,
    countryCode: agency.countryCode,
    gstin: agency.gstin,
    pan: agency.pan,
    brandPrimaryColor: agency.brandPrimaryColor,
    brandSecondaryColor: agency.brandSecondaryColor,
  };
}

function toWorkspaceSettings(workspace: WorkspacePreferenceFields): WorkspaceSettings {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    timezone: workspace.timezone,
    currency: workspace.currency,
    isActive: workspace.isActive,
    logoUrl: workspace.logoUrl,
    addressLine1: workspace.addressLine1,
    addressLine2: workspace.addressLine2,
    city: workspace.city,
    stateRegion: workspace.stateRegion,
    postalCode: workspace.postalCode,
    countryCode: workspace.countryCode,
    gstin: workspace.gstin,
    pan: workspace.pan,
    financialYearStartMonth: workspace.financialYearStartMonth,
    businessHoursStart: workspace.businessHoursStart,
    businessHoursEnd: workspace.businessHoursEnd,
    workingDays: parseWorkingDays(workspace.workingDays),
    language: workspace.language,
    dateFormat: workspace.dateFormat,
    numberFormat: workspace.numberFormat,
    preferencesJson: parsePreferenceCategories(workspace.preferencesJson),
  };
}

function toWorkspacePreferences(workspace: WorkspacePreferenceFields): WorkspacePreferences {
  return {
    timezone: workspace.timezone,
    currency: workspace.currency,
    language: workspace.language,
    dateFormat: workspace.dateFormat,
    numberFormat: workspace.numberFormat,
    workingDays: parseWorkingDays(workspace.workingDays),
    businessHoursStart: workspace.businessHoursStart,
    businessHoursEnd: workspace.businessHoursEnd,
    financialYearStartMonth: workspace.financialYearStartMonth,
    preferencesJson: parsePreferenceCategories(workspace.preferencesJson),
  };
}

function parseWorkingDays(value: Prisma.JsonValue): number[] {
  if (!Array.isArray(value)) {
    return [1, 2, 3, 4, 5];
  }

  return value.filter((entry): entry is number => typeof entry === 'number');
}

function parsePreferenceCategories(value: Prisma.JsonValue): PreferenceCategories {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, Record<string, unknown>> = {};
  for (const key of PREFERENCE_CATEGORY_KEYS) {
    const entry = (value as Record<string, unknown>)[key];
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      result[key] = { ...(entry as Record<string, unknown>) };
    }
  }

  return result;
}

function parseSystemPreferences(value: Prisma.JsonValue): SystemPreferences {
  const categories = parsePreferenceCategories(value);
  const system = categories.system ?? {};

  return {
    featureFlags: parseFeatureFlags(system.featureFlags),
    maintenanceMode:
      typeof system.maintenanceMode === 'boolean'
        ? system.maintenanceMode
        : DEFAULT_SYSTEM_PREFERENCES.maintenanceMode,
    maxUploadBytes:
      typeof system.maxUploadBytes === 'number' && Number.isFinite(system.maxUploadBytes)
        ? system.maxUploadBytes
        : DEFAULT_SYSTEM_PREFERENCES.maxUploadBytes,
    allowedFileTypes: parseAllowedFileTypes(system.allowedFileTypes),
    emailFrom:
      typeof system.emailFrom === 'string' && system.emailFrom.length > 0
        ? system.emailFrom
        : DEFAULT_SYSTEM_PREFERENCES.emailFrom,
    appVersion:
      typeof system.appVersion === 'string' && system.appVersion.length > 0
        ? system.appVersion
        : DEFAULT_SYSTEM_PREFERENCES.appVersion,
  };
}

function systemPreferencesToRecord(prefs: SystemPreferences): Record<string, unknown> {
  return {
    featureFlags: { ...prefs.featureFlags },
    maintenanceMode: prefs.maintenanceMode,
    maxUploadBytes: prefs.maxUploadBytes,
    allowedFileTypes: [...prefs.allowedFileTypes],
    emailFrom: prefs.emailFrom,
    appVersion: prefs.appVersion,
  };
}

function parseFeatureFlags(value: unknown): Readonly<Record<string, boolean>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_SYSTEM_PREFERENCES.featureFlags;
  }

  const result: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'boolean') {
      result[key] = entry;
    }
  }
  return result;
}

function parseAllowedFileTypes(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SYSTEM_PREFERENCES.allowedFileTypes;
  }

  const types = value.filter(
    (entry): entry is string => typeof entry === 'string' && entry.length > 0,
  );
  return types.length > 0 ? types : DEFAULT_SYSTEM_PREFERENCES.allowedFileTypes;
}

function mergePreferenceCategories(
  current: PreferenceCategories,
  patch: PreferenceCategories,
): PreferenceCategories {
  const merged: Record<string, Record<string, unknown>> = { ...asMutableCategories(current) };

  for (const key of PREFERENCE_CATEGORY_KEYS) {
    const patchCategory = patch[key];
    if (patchCategory === undefined) {
      continue;
    }
    merged[key] = {
      ...(merged[key] ?? {}),
      ...patchCategory,
    };
  }

  return merged;
}

function asMutableCategories(
  categories: PreferenceCategories,
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const key of PREFERENCE_CATEGORY_KEYS) {
    const entry = categories[key];
    if (entry !== undefined) {
      result[key] = { ...entry };
    }
  }
  return result;
}

function buildUserOrderBy(
  sortBy: NonNullable<ListSettingsUsersQuery['sortBy']>,
  sortDir: NonNullable<ListSettingsUsersQuery['sortDir']>,
): Prisma.EmployeeOrderByWithRelationInput {
  switch (sortBy) {
    case 'displayName':
      return { user: { displayName: sortDir } };
    case 'status':
      return { status: sortDir };
    case 'jobTitle':
      return { jobTitle: sortDir };
    case 'lastLoginAt':
      return { user: { lastLoginAt: sortDir } };
    case 'createdAt':
      return { createdAt: sortDir };
    case 'email':
    default:
      return { user: { email: sortDir } };
  }
}

function resolveDisplayName(user: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName.length > 0 ? fullName : user.email;
}

function isEmploymentStatus(value: string): value is EmploymentStatus {
  return (
    value === EmploymentStatus.ACTIVE ||
    value === EmploymentStatus.ON_LEAVE ||
    value === EmploymentStatus.TERMINATED
  );
}
