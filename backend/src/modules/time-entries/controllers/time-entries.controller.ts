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
import { StopTimeEntryDto } from '../dto/stop-time-entry.dto';
import { UpdateTimeEntryDto } from '../dto/update-time-entry.dto';
import { TimeEntryMapper } from '../mappers/time-entry.mapper';
import type { TimeEntryScope } from '../repositories/time-entry.repository.interface';
import type {
  TimeEntryApplicationContext,
  TimeEntryRecord,
} from '../services/time-entry-application.types';
import { TimeEntryService } from '../services/time-entry.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('time')
export class TimeEntriesController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Get('active')
  @RequirePermissions('time.read')
  async getActive(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<TimeEntryRecord | null>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const entry = await this.timeEntryService.getActiveTimer(scope, context);

    return successResponse(entry);
  }

  @Post(':id/stop')
  @RequirePermissions('time.manage')
  async stop(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) timeEntryId: string,
    @Body() dto: StopTimeEntryDto,
  ): Promise<ApiSuccessResponse<TimeEntryRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TimeEntryMapper.toStopTimeEntryCommand(dto);
    const entry = await this.timeEntryService.stopTimer(scope, timeEntryId, command, context);

    return successResponse(entry);
  }

  @Patch(':id')
  @RequirePermissions('time.manage')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) timeEntryId: string,
    @Body() dto: UpdateTimeEntryDto,
  ): Promise<ApiSuccessResponse<TimeEntryRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = TimeEntryMapper.toUpdateTimeEntryCommand(dto);
    const entry = await this.timeEntryService.updateTimeEntry(scope, timeEntryId, command, context);

    return successResponse(entry);
  }

  @Delete(':id')
  @RequirePermissions('time.manage')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) timeEntryId: string,
  ): Promise<ApiSuccessResponse<TimeEntryRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const entry = await this.timeEntryService.deleteTimeEntry(scope, timeEntryId, context);

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
