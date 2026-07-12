import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { AiScope, AiUsageSummary } from '../ai.types';
import { AiUsageSummaryQueryDto } from '../dto/ai-usage-summary-query.dto';
import { TokenUsageService } from '../services/token-usage.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

@Controller('ai/usage')
export class AiUsageController {
  constructor(private readonly tokenUsageService: TokenUsageService) {}

  @Get('summary')
  @RequirePermissions('ai.read')
  async summarize(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: AiUsageSummaryQueryDto,
  ): Promise<ApiSuccessResponse<AiUsageSummary>> {
    const scope = this.resolveScope(headers);
    const from = query.from !== undefined ? new Date(query.from) : undefined;
    const to = query.to !== undefined ? new Date(query.to) : undefined;

    if (from !== undefined && Number.isNaN(from.getTime())) {
      throw new BadRequestException('Query parameter "from" must be a valid ISO date.');
    }
    if (to !== undefined && Number.isNaN(to.getTime())) {
      throw new BadRequestException('Query parameter "to" must be a valid ISO date.');
    }

    const summary = await this.tokenUsageService.summarizeUsage(scope, from, to);
    return successResponse(summary);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): AiScope {
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

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
