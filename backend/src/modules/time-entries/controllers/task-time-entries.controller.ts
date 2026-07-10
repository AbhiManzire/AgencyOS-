import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateTimeEntryDto } from '../dto/create-time-entry.dto';
import { StartTimeEntryDto } from '../dto/start-time-entry.dto';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import type {
  TimeEntryRecord,
  TimeEntryScope,
} from '../repositories/time-entry.repository.interface';
import type { TimeEntryApplicationContext } from '../services/time-entry-application.types';
import { TimeEntryService } from '../services/time-entry.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('tasks/:taskId/time')
export class TaskTimeEntriesController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Get()
  @RequirePermissions('time.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<ApiSuccessResponse<readonly TimeEntryRecord[]>> {
    const scope = this.resolveScope(headers);
    const entries = await this.timeEntryService.listByTask(scope, taskId);

    return successResponse(entries);
  }

  @Post()
  @RequirePermissions('time.manage')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateTimeEntryDto,
  ): Promise<ApiSuccessResponse<TimeEntryRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TimeEntryMapper.toCreateTimeEntryCommand(dto);
    const entry = await this.timeEntryService.createTimeEntry(scope, taskId, command, context);

    return successResponse(entry);
  }

  @Post('start')
  @RequirePermissions('time.manage')
  async start(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: StartTimeEntryDto,
  ): Promise<ApiSuccessResponse<TimeEntryRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TimeEntryMapper.toStartTimeEntryCommand(dto);
    const entry = await this.timeEntryService.startTimer(scope, taskId, command, context);

    return successResponse(entry);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): TimeEntryScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): TimeEntryApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
