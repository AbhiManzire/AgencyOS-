import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../../rbac/decorators/require-permissions.decorator';
import { CreateSalesTaskDto } from '../dto/create-sales-task.dto';
import { ListSalesTasksQueryDto } from '../dto/list-sales-tasks-query.dto';
import { ReassignSalesTaskDto } from '../dto/reassign-sales-task.dto';
import { RescheduleSalesTaskDto } from '../dto/reschedule-sales-task.dto';
import { UpdateSalesTaskDto } from '../dto/update-sales-task.dto';
import { SalesTaskMapper } from '../mappers/sales-task.mapper';
import type { SalesTaskRecord } from '../repositories/sales-task.repository.interface';
import type {
  SalesTaskApplicationContext,
  SalesTaskScope,
} from '../services/sales-task-application.types';
import { SalesTaskService } from '../services/sales-task.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('sales-tasks')
export class SalesTasksController {
  constructor(private readonly salesTaskService: SalesTaskService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateSalesTaskDto,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = SalesTaskMapper.toCreateSalesTaskCommand(dto);
    const task = await this.salesTaskService.createSalesTask(scope, command, context);

    return successResponse(task);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListSalesTasksQueryDto,
  ): Promise<ApiSuccessResponse<readonly SalesTaskRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = SalesTaskMapper.toListSalesTasksQuery(queryDto);
    const ownerUserId = query.ownerUserId ?? this.readHeader(headers, USER_HEADER);
    const result = await this.salesTaskService.listSalesTasks(scope, {
      ...query,
      ownerUserId,
    });

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const task = await this.salesTaskService.getSalesTask(scope, id);

    return successResponse(task);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesTaskDto,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = SalesTaskMapper.toUpdateSalesTaskCommand(dto);
    const task = await this.salesTaskService.updateSalesTask(scope, id, command, context);

    return successResponse(task);
  }

  @Post(':id/complete')
  @RequirePermissions('sales.update')
  async complete(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const task = await this.salesTaskService.completeSalesTask(scope, id, context);

    return successResponse(task);
  }

  @Post(':id/cancel')
  @RequirePermissions('sales.update')
  async cancel(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const task = await this.salesTaskService.cancelSalesTask(scope, id, context);

    return successResponse(task);
  }

  @Post(':id/reschedule')
  @RequirePermissions('sales.update')
  async reschedule(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleSalesTaskDto,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = SalesTaskMapper.toRescheduleCommand(dto);
    const task = await this.salesTaskService.rescheduleSalesTask(scope, id, command, context);

    return successResponse(task);
  }

  @Post(':id/reassign')
  @RequirePermissions('sales.update')
  async reassign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReassignSalesTaskDto,
  ): Promise<ApiSuccessResponse<SalesTaskRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = SalesTaskMapper.toReassignCommand(dto);
    const task = await this.salesTaskService.reassignSalesTask(scope, id, command, context);

    return successResponse(task);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): SalesTaskScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): SalesTaskApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
