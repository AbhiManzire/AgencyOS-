import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { ProjectRecord } from '../../repositories/project.repository.interface';
import { CreateProjectFromClientDto } from '../dto/create-project-from-client.dto';
import { CreateProjectFromDealDto } from '../dto/create-project-from-deal.dto';
import { ProjectDeliveryMapper } from '../mappers/project-delivery.mapper';
import type {
  DeliveryDashboardResult,
  HoursSummary,
  ProjectDeliveryApplicationContext,
  ProjectPortalResult,
  ProjectScope,
  ProjectWorkspaceResult,
} from '../services/project-delivery-application.types';
import { ProjectDeliveryService } from '../services/project-delivery.service';
import { ProjectHealthService } from '../services/project-health.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('projects')
export class ProjectDeliveryController {
  constructor(
    private readonly projectDeliveryService: ProjectDeliveryService,
    private readonly projectHealthService: ProjectHealthService,
  ) {}

  @Post('from-deal')
  @RequirePermissions('projects.create')
  async createFromDeal(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateProjectFromDealDto,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectDeliveryMapper.toCreateFromDealCommand(dto);
    const project = await this.projectDeliveryService.createFromDeal(scope, command, context);

    return successResponse(project);
  }

  @Post('from-client')
  @RequirePermissions('projects.create')
  async createFromClient(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateProjectFromClientDto,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = ProjectDeliveryMapper.toCreateFromClientCommand(dto);
    const project = await this.projectDeliveryService.createFromClient(scope, command, context);

    return successResponse(project);
  }

  @Get('delivery/dashboard')
  @RequirePermissions('projects.read')
  async getDeliveryDashboard(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<DeliveryDashboardResult>> {
    const scope = this.resolveScope(headers);
    const dashboard = await this.projectDeliveryService.getDeliveryDashboard(scope);

    return successResponse(dashboard);
  }

  @Get(':id/health')
  @RequirePermissions('projects.read')
  async getHealth(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<{ score: number; status: string }>> {
    const scope = this.resolveScope(headers);
    const health = await this.projectHealthService.calculate(scope, id);

    return successResponse(health);
  }

  @Post(':id/health/refresh')
  @RequirePermissions('projects.update')
  async refreshHealth(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectRecord>> {
    const scope = this.resolveScope(headers);
    const project = await this.projectHealthService.refreshAndPersist(scope, id);

    return successResponse(project);
  }

  @Get(':id/workspace')
  @RequirePermissions('projects.read')
  async getWorkspace(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectWorkspaceResult>> {
    const scope = this.resolveScope(headers);
    const workspace = await this.projectDeliveryService.getWorkspace(scope, id);

    return successResponse(workspace);
  }

  @Get(':id/portal')
  @RequirePermissions('projects.read')
  async getPortal(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<ProjectPortalResult>> {
    const scope = this.resolveScope(headers);
    const portal = await this.projectDeliveryService.getPortal(scope, id);

    return successResponse(portal);
  }

  @Get(':id/hours-summary')
  @RequirePermissions('projects.read')
  async getHoursSummary(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<HoursSummary>> {
    const scope = this.resolveScope(headers);
    const summary = await this.projectDeliveryService.getHoursSummary(scope, id);

    return successResponse(summary);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ProjectScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ProjectDeliveryApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
