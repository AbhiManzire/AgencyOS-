import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { AssignProjectTagDto } from '../dto/assign-project-tag.dto';
import type { ProjectScope } from '../repositories/project.repository.interface';
import type {
  ProjectTagApplicationContext,
  ProjectTagResponse,
} from '../services/project-tag-application.types';
import { ProjectTagService } from '../services/project-tag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('projects/:projectId/tags')
export class ProjectTagsController {
  constructor(private readonly projectTagService: ProjectTagService) {}

  @Get()
  @RequirePermissions('projects.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ApiSuccessResponse<readonly ProjectTagResponse[]>> {
    const scope = this.resolveScope(headers);
    const tags = await this.projectTagService.listTags(scope, projectId);
    return successResponse(tags);
  }

  @Post()
  @RequirePermissions('projects.update')
  async assign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: AssignProjectTagDto,
  ): Promise<ApiSuccessResponse<ProjectTagResponse>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const tag = await this.projectTagService.assignTag(
      scope,
      projectId,
      {
        name: dto.name,
        colorToken: dto.colorToken,
      },
      context,
    );
    return successResponse(tag);
  }

  @Delete(':tagId')
  @RequirePermissions('projects.update')
  async unassign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<ApiSuccessResponse<{ readonly tagId: string }>> {
    const scope = this.resolveScope(headers);
    await this.projectTagService.unassignTag(scope, projectId, tagId);
    return successResponse({ tagId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProjectScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectTagApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
