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
import { CreateSubtaskDto } from '../dto/create-subtask.dto';
import { UpdateSubtaskDto } from '../dto/update-subtask.dto';
import { TaskSubtaskMapper } from '../mappers/task-subtask.mapper';
import type { TaskRecord } from '../repositories/task.repository.interface';
import type { TaskApplicationContext, TaskScope } from '../services/task-application.types';
import { TaskService } from '../services/task.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('tasks/:taskId/subtasks')
export class TaskSubtasksController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @RequirePermissions('tasks.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ApiSuccessResponse<readonly TaskRecord[]>> {
    const scope = this.resolveScope(headers);
    const subtasks = await this.taskService.listSubtasks(scope, taskId);

    return successResponse(subtasks);
  }

  @Post()
  @RequirePermissions('tasks.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateSubtaskDto,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskSubtaskMapper.toCreateSubtaskCommand(dto);
    const subtask = await this.taskService.createSubtask(scope, taskId, command, context);

    return successResponse(subtask);
  }

  @Patch(':subtaskId')
  @RequirePermissions('tasks.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskSubtaskMapper.toUpdateSubtaskCommand(dto);
    const subtask = await this.taskService.updateSubtask(
      scope,
      taskId,
      subtaskId,
      command,
      context,
    );

    return successResponse(subtask);
  }

  @Delete(':subtaskId')
  @RequirePermissions('tasks.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('subtaskId', ParseUUIDPipe) subtaskId: string,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const subtask = await this.taskService.deleteSubtask(scope, taskId, subtaskId, context);

    return successResponse(subtask);
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
