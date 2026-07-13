import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { ClientApplicationContext } from '../../services/client-application.types';
import type { ClientScope } from '../../repositories/client.repository.interface';
import { ConvertFromDealDto } from '../dto/convert-from-deal.dto';
import { ListClientTimelineQueryDto } from '../dto/list-client-timeline-query.dto';
import { MergeClientsDto } from '../dto/merge-clients.dto';
import {
  ClientConversionService,
  type ConvertFromWonDealResult,
} from '../services/client-conversion.service';
import { ClientHealthService, type ClientHealthResult } from '../services/client-health.service';
import { ClientMergeService, type MergeClientsResult } from '../services/client-merge.service';
import { ClientMetricsService, type ClientMetrics } from '../services/client-metrics.service';
import {
  ClientSuccessDashboardService,
  type ClientSuccessDashboard,
} from '../services/client-success-dashboard.service';
import {
  ClientWorkspaceService,
  type ClientTimelineResult,
  type ClientWorkspaceResult,
} from '../services/client-workspace.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('clients')
export class ClientSuccessController {
  constructor(
    private readonly dashboardService: ClientSuccessDashboardService,
    private readonly conversionService: ClientConversionService,
    private readonly mergeService: ClientMergeService,
    private readonly metricsService: ClientMetricsService,
    private readonly healthService: ClientHealthService,
    private readonly workspaceService: ClientWorkspaceService,
  ) {}

  @Get('success/dashboard')
  @RequirePermissions('clients.read')
  async getDashboard(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<ClientSuccessDashboard>> {
    const scope = this.resolveScope(headers);
    const dashboard = await this.dashboardService.getDashboard(scope);
    return successResponse(dashboard);
  }

  @Post('convert-from-deal')
  @RequirePermissions('clients.update')
  async convertFromDeal(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: ConvertFromDealDto,
  ): Promise<ApiSuccessResponse<ConvertFromWonDealResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.conversionService.convertFromWonDeal(scope, dto.dealId, context);
    return successResponse(result);
  }

  @Post('merge')
  @RequirePermissions('clients.update')
  async merge(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: MergeClientsDto,
  ): Promise<ApiSuccessResponse<MergeClientsResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.mergeService.mergeClients(
      scope,
      {
        sourceClientId: dto.sourceClientId,
        targetClientId: dto.targetClientId,
      },
      context,
    );
    return successResponse(result);
  }

  @Get(':id/metrics')
  @RequirePermissions('clients.read')
  async getMetrics(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ClientMetrics>> {
    const scope = this.resolveScope(headers);
    const metrics = await this.metricsService.getMetrics(scope, id);
    return successResponse(metrics);
  }

  @Get(':id/health')
  @RequirePermissions('clients.read')
  async getHealth(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ClientHealthResult>> {
    const scope = this.resolveScope(headers);
    const health = await this.healthService.calculate(scope, id);
    return successResponse(health);
  }

  @Post(':id/health/refresh')
  @RequirePermissions('clients.update')
  async refreshHealth(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ClientHealthResult>> {
    const scope = this.resolveScope(headers);
    const health = await this.healthService.refreshAndPersist(scope, id);
    return successResponse(health);
  }

  @Get(':id/workspace')
  @RequirePermissions('clients.read')
  async getWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ClientWorkspaceResult>> {
    const scope = this.resolveScope(headers);
    const workspace = await this.workspaceService.getWorkspace(scope, id);
    return successResponse(workspace);
  }

  @Get(':id/timeline')
  @RequirePermissions('clients.read')
  async getTimeline(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListClientTimelineQueryDto,
  ): Promise<ApiSuccessResponse<ClientTimelineResult['items']>> {
    const scope = this.resolveScope(headers);
    const timeline = await this.workspaceService.getTimeline(scope, id, {
      skip: query.skip,
      take: query.take,
    });
    return successResponse(timeline.items, {
      total: timeline.total,
      skip: timeline.skip,
      take: timeline.take,
    });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ClientScope {
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

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ClientApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
