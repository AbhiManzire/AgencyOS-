import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type {
  AutomationContext,
  AutomationScope,
  WorkflowExecutionRecord,
  WorkflowExecutionWithLogsRecord,
} from '../automation.types';
import { EnqueueExecutionDto } from '../dto/enqueue-execution.dto';
import { ListExecutionsQueryDto } from '../dto/list-executions-query.dto';
import { AutomationEngineService } from '../services/automation-engine.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@ApiTags('automation')
@Controller('automation/executions')
export class AutomationExecutionsController {
  constructor(private readonly automationEngineService: AutomationEngineService) {}

  @Get()
  @RequirePermissions('workflows.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListExecutionsQueryDto,
  ): Promise<ApiSuccessResponse<readonly WorkflowExecutionRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.automationEngineService.listExecutions(scope, {
      workflowId: queryDto.workflowId,
      status: queryDto.status,
      skip: queryDto.skip,
      take: queryDto.take,
    });

    return successResponse(result.items, {
      total: result.total,
      skip: queryDto.skip ?? 0,
      take: queryDto.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('workflows.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowExecutionWithLogsRecord>> {
    const scope = this.resolveScope(headers);
    const execution = await this.automationEngineService.getExecution(scope, id);

    return successResponse(execution);
  }

  @Post()
  @RequirePermissions('workflows.create')
  async enqueue(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: EnqueueExecutionDto,
  ): Promise<ApiSuccessResponse<WorkflowExecutionRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const execution = await this.automationEngineService.enqueueExecution(scope, {
      workflowId: dto.workflowId,
      triggerType: dto.triggerType,
      triggerPayload: dto.triggerPayload,
      triggeredByUserId: context.actorUserId || null,
      maxAttempts: dto.maxAttempts,
    });

    return successResponse(execution);
  }

  @Post(':id/retry')
  @RequirePermissions('workflows.create')
  async retry(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowExecutionRecord>> {
    const scope = this.resolveScope(headers);
    const execution = await this.automationEngineService.scheduleRetry(scope, id);

    return successResponse(execution);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): AutomationScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): AutomationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
