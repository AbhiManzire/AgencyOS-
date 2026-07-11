import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { AssignTaskTagDto } from '../dto/assign-task-tag.dto';
import type { TaskScope } from '../repositories/task.repository.interface';
import type {
  TaskTagApplicationContext,
  TaskTagResponse,
} from '../services/task-tag-application.types';
import { TaskTagService } from '../services/task-tag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('tasks/:taskId/tags')
export class TaskTagsController {
  constructor(private readonly taskTagService: TaskTagService) {}

  @Get()
  @RequirePermissions('tasks.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ApiSuccessResponse<readonly TaskTagResponse[]>> {
    const scope = this.resolveScope(headers);
    const tags = await this.taskTagService.listTags(scope, taskId);
    return successResponse(tags);
  }

  @Post()
  @RequirePermissions('tasks.update')
  async assign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: AssignTaskTagDto,
  ): Promise<ApiSuccessResponse<TaskTagResponse>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const tag = await this.taskTagService.assignTag(
      scope,
      taskId,
      {
        name: dto.name,
        colorToken: dto.colorToken,
      },
      context,
    );
    return successResponse(tag);
  }

  @Delete(':tagId')
  @RequirePermissions('tasks.update')
  async unassign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<ApiSuccessResponse<{ readonly tagId: string }>> {
    const scope = this.resolveScope(headers);
    await this.taskTagService.unassignTag(scope, taskId, tagId);
    return successResponse({ tagId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): TaskScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): TaskTagApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
