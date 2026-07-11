import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateTaskDependencyDto } from '../dto/create-task-dependency.dto';
import type { TaskDependencyRecord, TaskScope } from '../repositories/task.repository.interface';
import type { TaskApplicationContext } from '../services/task-application.types';
import { TaskService } from '../services/task.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('tasks/:taskId/dependencies')
export class TaskDependenciesController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @RequirePermissions('tasks.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ApiSuccessResponse<readonly TaskDependencyRecord[]>> {
    const scope = this.resolveScope(headers);
    const dependencies = await this.taskService.listDependencies(scope, taskId);
    return successResponse(dependencies);
  }

  @Post()
  @RequirePermissions('tasks.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateTaskDependencyDto,
  ): Promise<ApiSuccessResponse<TaskDependencyRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const dependency = await this.taskService.addDependency(
      scope,
      taskId,
      dto.dependsOnTaskId,
      context,
    );
    return successResponse(dependency);
  }

  @Delete(':dependencyId')
  @RequirePermissions('tasks.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('dependencyId', ParseUUIDPipe) dependencyId: string,
  ): Promise<ApiSuccessResponse<{ readonly dependencyId: string }>> {
    const scope = this.resolveScope(headers);
    await this.taskService.removeDependency(scope, taskId, dependencyId);
    return successResponse({ dependencyId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): TaskScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): TaskApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
