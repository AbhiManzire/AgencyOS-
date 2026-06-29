import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProjectMemberDomainService } from '../domain/project-member-domain.service';
import {
  PROJECT_MEMBER_DOMAIN_ERROR_CODES,
  ProjectMemberDomainError,
} from '../domain/project-member-domain.errors';
import { PROJECT_DOMAIN_ERROR_CODES, ProjectDomainError } from '../domain/project-domain.errors';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_MEMBER_REPOSITORY,
  type CreateProjectMemberData,
  type ProjectMemberRecord,
  type ProjectMemberRepository,
  type ProjectMemberScope,
  type UpdateProjectMemberData,
} from '../repositories/project-member.repository.interface';
import {
  PROJECT_REPOSITORY,
  type ProjectRepository,
  type ProjectScope,
} from '../repositories/project.repository.interface';
import type {
  CreateProjectMemberCommand,
  ListProjectMembersResult,
  ProjectMemberApplicationContext,
  UpdateProjectMemberCommand,
} from './project-member-application.types';

@Injectable()
export class ProjectMemberService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: ProjectMemberRepository,
    private readonly projectMemberDomainService: ProjectMemberDomainService,
    private readonly prisma: PrismaService,
  ) {}

  async listMembers(scope: ProjectScope, projectId: string): Promise<ListProjectMembersResult> {
    await this.requireProjectForRead(scope, projectId);
    const memberScope = this.toMemberScope(scope, projectId);

    const [members, availableUsers] = await Promise.all([
      this.projectMemberRepository.listByProject(memberScope),
      this.projectMemberRepository.listWorkspaceUsers(scope),
    ]);

    return { members, availableUsers };
  }

  async createMember(
    scope: ProjectScope,
    projectId: string,
    command: CreateProjectMemberCommand,
    context: ProjectMemberApplicationContext,
  ): Promise<ProjectMemberRecord> {
    await this.requireProjectForMutation(scope, projectId);

    this.projectMemberDomainService.validateCreate({
      userId: command.userId,
      role: command.role,
      allocationPercent: command.allocationPercent,
      status: command.status,
    });

    const memberScope = this.toMemberScope(scope, projectId);

    if (!(await this.projectMemberRepository.isWorkspaceUser(scope, command.userId))) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.USER_NOT_WORKSPACE_MEMBER,
        'User is not an active member of the workspace.',
      );
    }

    const existing = await this.projectMemberRepository.findActiveByProjectAndUser(
      memberScope,
      command.userId,
    );
    if (existing !== null) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.MEMBER_ALREADY_EXISTS,
        'User is already assigned to this project.',
      );
    }

    const role = command.role ?? 'MEMBER';
    if (role === 'LEAD') {
      const existingLead = await this.projectMemberRepository.findActiveLead(memberScope);
      if (existingLead !== null) {
        throw new ProjectMemberDomainError(
          PROJECT_MEMBER_DOMAIN_ERROR_CODES.LEAD_ALREADY_EXISTS,
          'This project already has a lead assigned.',
        );
      }
    }

    const now = new Date();
    const data: CreateProjectMemberData = {
      id: randomUUID(),
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
      userId: command.userId,
      role,
      allocationPercent: command.allocationPercent ?? null,
      startDate: command.startDate ?? null,
      status: command.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdByUserId: context.actorUserId,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async () => this.projectMemberRepository.create(data));
  }

  async updateMember(
    scope: ProjectScope,
    projectId: string,
    memberId: string,
    command: UpdateProjectMemberCommand,
    context: ProjectMemberApplicationContext,
  ): Promise<ProjectMemberRecord> {
    await this.requireProjectForMutation(scope, projectId);

    const memberScope = this.toMemberScope(scope, projectId);
    const existing = await this.requireMember(memberScope, memberId);

    this.projectMemberDomainService.validateUpdate({
      role: command.role,
      allocationPercent: command.allocationPercent,
      status: command.status,
    });

    if (command.role === 'LEAD' && existing.role !== 'LEAD') {
      const existingLead = await this.projectMemberRepository.findActiveLead(memberScope, memberId);
      if (existingLead !== null) {
        throw new ProjectMemberDomainError(
          PROJECT_MEMBER_DOMAIN_ERROR_CODES.LEAD_ALREADY_EXISTS,
          'This project already has a lead assigned.',
        );
      }
    }

    const now = new Date();
    const data: UpdateProjectMemberData = {
      ...(command.role !== undefined ? { role: command.role } : {}),
      ...(command.allocationPercent !== undefined
        ? { allocationPercent: command.allocationPercent }
        : {}),
      ...(command.startDate !== undefined ? { startDate: command.startDate } : {}),
      ...(command.status !== undefined ? { status: command.status } : {}),
      updatedAt: now,
      updatedByUserId: context.actorUserId,
    };

    return this.prisma.$transaction(async () => {
      const updated = await this.projectMemberRepository.update(memberScope, memberId, data);
      if (updated === null) {
        throw new ProjectMemberDomainError(
          PROJECT_MEMBER_DOMAIN_ERROR_CODES.PROJECT_MEMBER_NOT_FOUND,
          'Project member was not found.',
        );
      }

      return updated;
    });
  }

  async deleteMember(
    scope: ProjectScope,
    projectId: string,
    memberId: string,
    context: ProjectMemberApplicationContext,
  ): Promise<ProjectMemberRecord> {
    await this.requireProjectForMutation(scope, projectId);

    const memberScope = this.toMemberScope(scope, projectId);
    await this.requireMember(memberScope, memberId);

    const now = new Date();

    return this.prisma.$transaction(async () => {
      const deleted = await this.projectMemberRepository.softDelete(memberScope, memberId, {
        status: 'INACTIVE',
        deletedAt: now,
        deletedByUserId: context.actorUserId,
        updatedAt: now,
        updatedByUserId: context.actorUserId,
      });

      if (deleted === null) {
        throw new ProjectMemberDomainError(
          PROJECT_MEMBER_DOMAIN_ERROR_CODES.PROJECT_MEMBER_NOT_FOUND,
          'Project member was not found.',
        );
      }

      return deleted;
    });
  }

  private async requireProjectForRead(scope: ProjectScope, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }
  }

  private async requireProjectForMutation(scope: ProjectScope, projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(scope, projectId);
    if (project === null) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.PROJECT_NOT_FOUND,
        'Project was not found.',
      );
    }

    if (project.deletedAt !== null) {
      throw new ProjectDomainError(
        PROJECT_DOMAIN_ERROR_CODES.PROJECT_ARCHIVED,
        'Project is archived and cannot be modified.',
      );
    }
  }

  private async requireMember(
    scope: ProjectMemberScope,
    memberId: string,
  ): Promise<ProjectMemberRecord> {
    const member = await this.projectMemberRepository.findById(scope, memberId);
    if (member === null) {
      throw new ProjectMemberDomainError(
        PROJECT_MEMBER_DOMAIN_ERROR_CODES.PROJECT_MEMBER_NOT_FOUND,
        'Project member was not found.',
      );
    }

    return member;
  }

  private toMemberScope(scope: ProjectScope, projectId: string): ProjectMemberScope {
    return {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId,
    };
  }
}
