import {
  BadRequestException,
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
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateScheduledReportDto } from '../dto/create-scheduled-report.dto';
import { ListScheduledReportsQueryDto } from '../dto/list-scheduled-reports-query.dto';
import { UpdateScheduledReportDto } from '../dto/update-scheduled-report.dto';
import type { ReportsScope, ScheduledReportRecord } from '../reports.types';
import { ScheduledReportService } from '../services/scheduled-report.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('reports/schedules')
export class ScheduledReportsController {
  constructor(private readonly scheduledReportService: ScheduledReportService) {}

  @Get()
  @RequirePermissions('reports.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListScheduledReportsQueryDto,
  ): Promise<ApiSuccessResponse<readonly ScheduledReportRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.scheduledReportService.list(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Post()
  @RequirePermissions('reports.read')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateScheduledReportDto,
  ): Promise<ApiSuccessResponse<ScheduledReportRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const created = await this.scheduledReportService.create(scope, dto, context);
    return successResponse(created);
  }

  @Post('process-due')
  @RequirePermissions('reports.read')
  async processDue(): Promise<
    ApiSuccessResponse<{ processed: number; succeeded: number; failed: number }>
  > {
    const result = await this.scheduledReportService.processDue();
    return successResponse(result);
  }

  @Get(':id')
  @RequirePermissions('reports.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ScheduledReportRecord>> {
    const scope = this.resolveScope(headers);
    const record = await this.scheduledReportService.getById(scope, id);
    return successResponse(record);
  }

  @Patch(':id')
  @RequirePermissions('reports.read')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScheduledReportDto,
  ): Promise<ApiSuccessResponse<ScheduledReportRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const updated = await this.scheduledReportService.update(scope, id, dto, context);
    return successResponse(updated);
  }

  @Delete(':id')
  @RequirePermissions('reports.read')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ScheduledReportRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const deleted = await this.scheduledReportService.softDelete(scope, id, context);
    return successResponse(deleted);
  }

  @Post(':id/run')
  @RequirePermissions('reports.read')
  async runNow(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ScheduledReportRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.scheduledReportService.runNow(scope, id, context);
    return successResponse(result);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ReportsScope {
    const tenantId = this.readHeader(headers, TENANT_HEADER);
    const workspaceId = this.readHeader(headers, WORKSPACE_HEADER);

    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" must be a valid UUID.`);
    }
    if (!isUUID(workspaceId)) {
      throw new BadRequestException(`Header "${WORKSPACE_HEADER}" must be a valid UUID.`);
    }

    return { tenantId, workspaceId };
  }

  private resolveContext(headers: Record<string, string | string[] | undefined>): {
    actorUserId: string | null;
  } {
    const userId = this.readHeader(headers, USER_HEADER);
    if (userId === '') {
      return { actorUserId: null };
    }
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return { actorUserId: userId };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
