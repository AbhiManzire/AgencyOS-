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
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateProjectMilestoneDto } from '../dto/create-project-milestone.dto';
import { UpdateProjectMilestoneDto } from '../dto/update-project-milestone.dto';
import { ProjectMilestoneMapper } from '../mappers/project-milestone.mapper';
import type { ProjectMilestoneRecord } from '../repositories/project-milestone.repository.interface';
import type { ProjectScope } from '../repositories/project.repository.interface';
import type { ProjectMilestoneApplicationContext } from '../services/project-milestone-application.types';
import { ProjectMilestoneService } from '../services/project-milestone.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('projects/:projectId/milestones')
export class ProjectMilestonesController {
  constructor(private readonly projectMilestoneService: ProjectMilestoneService) {}

  @Get()
  @RequirePermissions('projects.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ApiSuccessResponse<readonly ProjectMilestoneRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.projectMilestoneService.listMilestones(scope, projectId);

    return successResponse(result.milestones, {
      availableOwners: result.availableOwners,
    });
  }

  @Post()
  @RequirePermissions('projects.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProjectMilestoneDto,
  ): Promise<ApiSuccessResponse<ProjectMilestoneRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMilestoneMapper.toCreateProjectMilestoneCommand(dto);
    const milestone = await this.projectMilestoneService.createMilestone(
      scope,
      projectId,
      command,
      context,
    );

    return successResponse(milestone);
  }

  @Patch(':milestoneId')
  @RequirePermissions('projects.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateProjectMilestoneDto,
  ): Promise<ApiSuccessResponse<ProjectMilestoneRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMilestoneMapper.toUpdateProjectMilestoneCommand(dto);
    const milestone = await this.projectMilestoneService.updateMilestone(
      scope,
      projectId,
      milestoneId,
      command,
      context,
    );

    return successResponse(milestone);
  }

  @Delete(':milestoneId')
  @RequirePermissions('projects.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ): Promise<ApiSuccessResponse<ProjectMilestoneRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const milestone = await this.projectMilestoneService.deleteMilestone(
      scope,
      projectId,
      milestoneId,
      context,
    );

    return successResponse(milestone);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProjectScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectMilestoneApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
