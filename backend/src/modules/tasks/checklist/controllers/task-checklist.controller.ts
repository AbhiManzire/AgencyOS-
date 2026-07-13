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
import { CreateTaskChecklistItemDto } from '../dto/create-task-checklist-item.dto';
import { UpdateTaskChecklistItemDto } from '../dto/update-task-checklist-item.dto';
import { TaskChecklistItemMapper } from '../mappers/task-checklist-item.mapper';
import type { TaskChecklistItemRecord } from '../repositories/task-checklist-item.repository.interface';
import type {
  TaskChecklistApplicationContext,
  TaskScope,
} from '../services/task-checklist-item-application.types';
import { TaskChecklistItemService } from '../services/task-checklist-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('tasks')
export class TaskChecklistController {
  constructor(private readonly taskChecklistItemService: TaskChecklistItemService) {}

  @Get(':taskId/checklist')
  @RequirePermissions('tasks.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ApiSuccessResponse<readonly TaskChecklistItemRecord[]>> {
    const scope = this.resolveScope(headers);
    const items = await this.taskChecklistItemService.listItems(scope, taskId);

    return successResponse(items);
  }

  @Post(':taskId/checklist')
  @RequirePermissions('tasks.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateTaskChecklistItemDto,
  ): Promise<ApiSuccessResponse<TaskChecklistItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskChecklistItemMapper.toCreateCommand(dto);
    const item = await this.taskChecklistItemService.createItem(scope, taskId, command, context);

    return successResponse(item);
  }

  @Patch(':taskId/checklist/:itemId')
  @RequirePermissions('tasks.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateTaskChecklistItemDto,
  ): Promise<ApiSuccessResponse<TaskChecklistItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TaskChecklistItemMapper.toUpdateCommand(dto);
    const item = await this.taskChecklistItemService.updateItem(
      scope,
      taskId,
      itemId,
      command,
      context,
    );

    return successResponse(item);
  }

  @Delete(':taskId/checklist/:itemId')
  @RequirePermissions('tasks.update')
  async delete(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<ApiSuccessResponse<TaskChecklistItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const item = await this.taskChecklistItemService.deleteItem(scope, taskId, itemId, context);

    return successResponse(item);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): TaskScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): TaskChecklistApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
