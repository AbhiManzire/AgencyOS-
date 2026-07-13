import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { WorkspaceCalendarQueryDto } from '../dto/calendar-query.dto';
import { ListWorkspaceQueueQueryDto } from '../dto/list-queue-query.dto';
import { QuickActionDto } from '../dto/quick-action.dto';
import type {
  QuickActionResult,
  WorkspaceApplicationContext,
  WorkspaceCalendarResult,
  WorkspaceDashboardResult,
  WorkspaceQueueResult,
  WorkspaceScope,
} from '../services/workspace-application.types';
import { WorkspaceCalendarService } from '../services/workspace-calendar.service';
import { WorkspaceDashboardService } from '../services/workspace-dashboard.service';
import { WorkspaceQuickActionsService } from '../services/workspace-quick-actions.service';
import { WorkspaceQueueService } from '../services/workspace-queue.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('sales-workspace')
export class SalesWorkspaceController {
  constructor(
    private readonly workspaceDashboardService: WorkspaceDashboardService,
    private readonly workspaceQueueService: WorkspaceQueueService,
    private readonly workspaceCalendarService: WorkspaceCalendarService,
    private readonly workspaceQuickActionsService: WorkspaceQuickActionsService,
  ) {}

  @Get('dashboard')
  @RequirePermissions('sales.read')
  async dashboard(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<WorkspaceDashboardResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.workspaceDashboardService.getDashboard(scope, context);
    return successResponse(result);
  }

  @Get('queue')
  @RequirePermissions('sales.read')
  async queue(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ListWorkspaceQueueQueryDto,
  ): Promise<ApiSuccessResponse<WorkspaceQueueResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const skip = query.skip ?? 0;
    const take = query.take ?? 25;
    const result = await this.workspaceQueueService.getQueue(scope, context, skip, take);
    return successResponse(result, { total: result.total, skip, take });
  }

  @Get('calendar')
  @RequirePermissions('sales.read')
  async calendar(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: WorkspaceCalendarQueryDto,
  ): Promise<ApiSuccessResponse<WorkspaceCalendarResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.workspaceCalendarService.getCalendar(
      scope,
      context,
      query.view ?? 'month',
      query.from,
      query.to,
    );
    return successResponse(result);
  }

  @Post('quick-actions')
  @RequirePermissions('sales.update')
  async quickActions(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: QuickActionDto,
  ): Promise<ApiSuccessResponse<QuickActionResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.workspaceQuickActionsService.execute(
      scope,
      {
        action: dto.action,
        taskId: dto.taskId,
        leadId: dto.leadId,
        dealId: dto.dealId,
        clientId: dto.clientId,
        dueDate: dto.dueDate,
        dueTime: dto.dueTime,
        ownerUserId: dto.ownerUserId,
        note: dto.note,
        title: dto.title,
        description: dto.description,
      },
      context,
    );
    return successResponse(result);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): WorkspaceScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): WorkspaceApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
