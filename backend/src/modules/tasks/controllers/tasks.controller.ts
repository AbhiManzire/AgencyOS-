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
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateTaskDto } from '../dto/create-task.dto';
import { ListTasksQueryDto } from '../dto/list-tasks-query.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { TaskMapper } from '../mappers/task.mapper';
import type { TaskRecord } from '../repositories/task.repository.interface';
import type { TaskApplicationContext, TaskScope } from '../services/task-application.types';
import { TaskService } from '../services/task.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions('tasks.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateTaskDto,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskMapper.toCreateTaskCommand(dto);
    const task = await this.taskService.createTask(scope, command, context);

    return successResponse(task);
  }

  @Get()
  @RequirePermissions('tasks.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListTasksQueryDto,
  ): Promise<ApiSuccessResponse<readonly TaskRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = TaskMapper.toListTasksQuery(queryDto);
    const result = await this.taskService.listTasks(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('tasks.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const task = await this.taskService.getTask(scope, id);

    return successResponse(task);
  }

  @Patch(':id')
  @RequirePermissions('tasks.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskMapper.toUpdateTaskCommand(dto);
    const task = await this.taskService.updateTask(scope, id, command, context);

    return successResponse(task);
  }

  @Delete(':id')
  @RequirePermissions('tasks.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const task = await this.taskService.archiveTask(scope, id, context);

    return successResponse(task);
  }

  @Post(':id/restore')
  @RequirePermissions('tasks.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<TaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const task = await this.taskService.restoreTask(scope, id, context);

    return successResponse(task);
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
