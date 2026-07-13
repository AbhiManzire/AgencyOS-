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
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateProjectTemplateDto } from '../dto/create-project-template.dto';
import { UpdateProjectTemplateDto } from '../dto/update-project-template.dto';
import { ProjectTemplateMapper } from '../mappers/project-template.mapper';
import type { ProjectTemplateRecord } from '../repositories/project-template.repository.interface';
import type { ProjectTemplateScope } from '../repositories/project-template.repository.interface';
import type { ProjectTemplateApplicationContext } from '../services/project-template-application.types';
import { ProjectTemplateService } from '../services/project-template.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private readonly projectTemplateService: ProjectTemplateService) {}

  @Post()
  @RequirePermissions('projects.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateProjectTemplateDto,
  ): Promise<ApiSuccessResponse<ProjectTemplateRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectTemplateMapper.toCreateTemplateCommand(dto);
    const template = await this.projectTemplateService.createTemplate(scope, command, context);

    return successResponse(template);
  }

  @Get()
  @RequirePermissions('projects.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<readonly ProjectTemplateRecord[]>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const templates = await this.projectTemplateService.listTemplates(scope, context);

    return successResponse(templates);
  }

  @Get(':id')
  @RequirePermissions('projects.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectTemplateRecord>> {
    const scope = this.resolveScope(headers);
    const template = await this.projectTemplateService.getTemplate(scope, id);

    return successResponse(template);
  }

  @Patch(':id')
  @RequirePermissions('projects.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectTemplateDto,
  ): Promise<ApiSuccessResponse<ProjectTemplateRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectTemplateMapper.toUpdateTemplateCommand(dto);
    const template = await this.projectTemplateService.updateTemplate(scope, id, command, context);

    return successResponse(template);
  }

  @Delete(':id')
  @RequirePermissions('projects.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectTemplateRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const template = await this.projectTemplateService.archiveTemplate(scope, id, context);

    return successResponse(template);
  }

  private resolveScope(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectTemplateScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectTemplateApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
