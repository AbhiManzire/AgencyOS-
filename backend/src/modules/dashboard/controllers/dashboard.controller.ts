import { BadRequestException, Controller, Get, Headers } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { DashboardAdminSummary, DashboardScope, DashboardSummary } from '../dashboard.types';
import { DashboardService } from '../services/dashboard.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard.read')
  async getSummary(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<DashboardSummary>> {
    const scope = this.resolveScope(headers);
    const summary = await this.dashboardService.getSummary(scope);

    return successResponse(summary);
  }

  @Get('admin-summary')
  @RequirePermissions('settings.read')
  async getAdminSummary(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<DashboardAdminSummary>> {
    const scope = this.resolveScope(headers);
    const actorUserId = this.resolveUserId(headers);
    const summary = await this.dashboardService.getAdminSummary(scope, actorUserId);

    return successResponse(summary);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DashboardScope {
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

  private resolveUserId(headers: Record<string, string | string[] | undefined>): string {
    const userId = this.readHeader(headers, USER_HEADER);
    if (!isUUID(userId)) {
      throw new BadRequestException(`Header "${USER_HEADER}" must be a valid UUID.`);
    }
    return userId;
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
