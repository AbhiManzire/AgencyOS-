import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { UpdatePipelineStageDto } from '../dto/update-pipeline-stage.dto';
import { PipelineMapper } from '../mappers/pipeline.mapper';
import type {
  PipelineApplicationContext,
  PipelineRecord,
  PipelineScope,
  PipelineStageRecord,
} from '../services/pipeline-application.types';
import { SalesPipelineService } from '../services/sales-pipeline.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly salesPipelineService: SalesPipelineService) {}

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<readonly PipelineRecord[]>> {
    const scope = this.resolveScope(headers);
    const pipelines = await this.salesPipelineService.listPipelines(scope);
    return successResponse(pipelines);
  }

  @Get('default')
  @RequirePermissions('sales.read')
  async getDefault(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<PipelineRecord>> {
    const scope = this.resolveScope(headers);
    const pipeline = await this.salesPipelineService.getDefaultPipeline(scope);
    return successResponse(pipeline);
  }

  @Patch(':id/stages/:stageId')
  @RequirePermissions('sales.update')
  async updateStage(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Body() dto: UpdatePipelineStageDto,
  ): Promise<ApiSuccessResponse<PipelineStageRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = PipelineMapper.toUpdatePipelineStageCommand(dto);
    const stage = await this.salesPipelineService.updateStage(scope, id, stageId, command, context);
    return successResponse(stage);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): PipelineScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): PipelineApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
