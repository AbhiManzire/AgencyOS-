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
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateFollowUpDto } from '../dto/create-follow-up.dto';
import { ListFollowUpsQueryDto } from '../dto/list-follow-ups-query.dto';
import { UpdateFollowUpDto } from '../dto/update-follow-up.dto';
import { FollowUpMapper } from '../mappers/follow-up.mapper';
import type { FollowUpRecord } from '../repositories/follow-up.repository.interface';
import type {
  FollowUpApplicationContext,
  FollowUpDashboardSummary,
  FollowUpScope,
} from '../services/follow-up-application.types';
import { FollowUpService } from '../services/follow-up.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateFollowUpDto,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = FollowUpMapper.toCreateFollowUpCommand(dto);
    const followUp = await this.followUpService.createFollowUp(scope, command, context);

    return successResponse(followUp);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListFollowUpsQueryDto,
  ): Promise<ApiSuccessResponse<readonly FollowUpRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = FollowUpMapper.toListFollowUpsQuery(queryDto);
    const result = await this.followUpService.listFollowUps(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('dashboard/summary')
  @RequirePermissions('sales.read')
  async dashboardSummary(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<FollowUpDashboardSummary>> {
    const scope = this.resolveScope(headers);
    const summary = await this.followUpService.getDashboardSummary(scope);
    return successResponse(summary);
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const followUp = await this.followUpService.getFollowUp(scope, id);
    return successResponse(followUp);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFollowUpDto,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = FollowUpMapper.toUpdateFollowUpCommand(dto);
    const followUp = await this.followUpService.updateFollowUp(scope, id, command, context);
    return successResponse(followUp);
  }

  @Post(':id/complete')
  @RequirePermissions('sales.update')
  async complete(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const followUp = await this.followUpService.completeFollowUp(scope, id, context);
    return successResponse(followUp);
  }

  @Post(':id/cancel')
  @RequirePermissions('sales.update')
  async cancel(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const followUp = await this.followUpService.cancelFollowUp(scope, id, context);
    return successResponse(followUp);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): FollowUpScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): FollowUpApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
