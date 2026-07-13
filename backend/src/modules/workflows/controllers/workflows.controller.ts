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
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import type { WorkflowExecutionRecord } from '../../automation/automation.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { ListWorkflowsQueryDto } from '../dto/list-workflows-query.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { WorkflowMapper } from '../mappers/workflow.mapper';
import type { WorkflowRecord } from '../repositories/workflow.repository.interface';
import type {
  WorkflowApplicationContext,
  WorkflowScope,
} from '../services/workflow-application.types';
import { WorkflowService } from '../services/workflow.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @RequirePermissions('workflows.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateWorkflowDto,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = WorkflowMapper.toCreateWorkflowCommand(dto);
    const workflow = await this.workflowService.createWorkflow(scope, command, context);

    return successResponse(workflow);
  }

  @Get()
  @RequirePermissions('workflows.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListWorkflowsQueryDto,
  ): Promise<ApiSuccessResponse<readonly WorkflowRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = WorkflowMapper.toListWorkflowsQuery(queryDto);
    const result = await this.workflowService.listWorkflows(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('workflows.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const workflow = await this.workflowService.getWorkflow(scope, id);

    return successResponse(workflow);
  }

  @Get(':id/executions')
  @RequirePermissions('workflows.read')
  async listExecutions(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: ListWorkflowsQueryDto,
  ): Promise<ApiSuccessResponse<readonly WorkflowExecutionRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.workflowService.listWorkflowExecutions(scope, id, {
      skip: queryDto.skip,
      take: queryDto.take,
    });

    return successResponse(result.items, {
      total: result.total,
      skip: queryDto.skip ?? 0,
      take: queryDto.take ?? 25,
    });
  }

  @Patch(':id')
  @RequirePermissions('workflows.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = WorkflowMapper.toUpdateWorkflowCommand(dto);
    const workflow = await this.workflowService.updateWorkflow(scope, id, command, context);

    return successResponse(workflow);
  }

  @Post(':id/enable')
  @RequirePermissions('workflows.update')
  async enable(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const workflow = await this.workflowService.enableWorkflow(scope, id, context);

    return successResponse(workflow);
  }

  @Post(':id/disable')
  @RequirePermissions('workflows.update')
  async disable(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const workflow = await this.workflowService.disableWorkflow(scope, id, context);

    return successResponse(workflow);
  }

  @Post(':id/execute')
  @RequirePermissions('workflows.create')
  async execute(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteWorkflowDto,
  ): Promise<ApiSuccessResponse<WorkflowExecutionRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = WorkflowMapper.toExecuteWorkflowCommand(dto);
    const execution = await this.workflowService.executeWorkflow(scope, id, command, context);

    return successResponse(execution);
  }

  @Delete(':id')
  @RequirePermissions('workflows.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<WorkflowRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const workflow = await this.workflowService.archiveWorkflow(scope, id, context);

    return successResponse(workflow);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): WorkflowScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): WorkflowApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
