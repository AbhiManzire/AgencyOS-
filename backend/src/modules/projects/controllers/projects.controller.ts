import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateProjectDto } from '../dto/create-project.dto';
import { ListProjectsQueryDto } from '../dto/list-projects-query.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectMapper } from '../mappers/project.mapper';
import type { ProjectRecord } from '../repositories/project.repository.interface';
import type {
  ProjectApplicationContext,
  ProjectScope,
} from '../services/project-application.types';
import { ProjectService } from '../services/project.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @RequirePermissions('projects.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateProjectDto,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMapper.toCreateProjectCommand(dto);
    const project = await this.projectService.createProject(scope, command, context);

    return successResponse(project);
  }

  @Get()
  @RequirePermissions('projects.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListProjectsQueryDto,
  ): Promise<ApiSuccessResponse<readonly ProjectRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = ProjectMapper.toListProjectsQuery(queryDto);
    const result = await this.projectService.listProjects(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const project = await this.projectService.getProject(scope, id);

    return successResponse(project);
  }

  @Patch(':id')
  @RequirePermissions('projects.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectMapper.toUpdateProjectCommand(dto);
    const project = await this.projectService.updateProject(scope, id, command, context);

    return successResponse(project);
  }

  @Post(':id/complete')
  @RequirePermissions('projects.update')
  async complete(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const project = await this.projectService.completeProject(scope, id, context);

    return successResponse(project);
  }

  @Post(':id/invoice-ready')
  @RequirePermissions('projects.update')
  async markInvoiceReady(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const project = await this.projectService.markInvoiceReady(scope, id, context);

    return successResponse(project);
  }

  @Post(':id/archive')
  @RequirePermissions('projects.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const project = await this.projectService.archiveProject(scope, id, context);

    return successResponse(project);
  }

  @Post(':id/restore')
  @RequirePermissions('projects.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const project = await this.projectService.restoreProject(scope, id, context);

    return successResponse(project);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProjectScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
