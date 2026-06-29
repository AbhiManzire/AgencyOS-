import {
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
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateProjectMemberDto } from '../dto/create-project-member.dto';
import { UpdateProjectMemberDto } from '../dto/update-project-member.dto';
import { ProjectMemberMapper } from '../mappers/project-member.mapper';
import type { ProjectMemberRecord } from '../repositories/project-member.repository.interface';
import type { ProjectScope } from '../repositories/project.repository.interface';
import type { ProjectMemberApplicationContext } from '../services/project-member-application.types';
import { ProjectMemberService } from '../services/project-member.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('projects/:projectId/members')
export class ProjectMembersController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @Get()
  @RequirePermissions('projects.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ApiSuccessResponse<readonly ProjectMemberRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.projectMemberService.listMembers(scope, projectId);

    return successResponse(result.members, {
      availableUsers: result.availableUsers,
    });
  }

  @Post()
  @RequirePermissions('projects.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectMemberDto,
  ): Promise<ApiSuccessResponse<ProjectMemberRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMemberMapper.toCreateProjectMemberCommand(dto);
    const member = await this.projectMemberService.createMember(scope, projectId, command, context);

    return successResponse(member);
  }

  @Patch(':memberId')
  @RequirePermissions('projects.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateProjectMemberDto,
  ): Promise<ApiSuccessResponse<ProjectMemberRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMemberMapper.toUpdateProjectMemberCommand(dto);
    const member = await this.projectMemberService.updateMember(
      scope,
      projectId,
      memberId,
      command,
      context,
    );

    return successResponse(member);
  }

  @Delete(':memberId')
  @RequirePermissions('projects.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<ApiSuccessResponse<ProjectMemberRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const member = await this.projectMemberService.deleteMember(
      scope,
      projectId,
      memberId,
      context,
    );

    return successResponse(member);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProjectScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectMemberApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
