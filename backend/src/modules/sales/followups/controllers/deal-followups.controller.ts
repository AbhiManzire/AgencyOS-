import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { DealScope } from '../../deals/repositories/deal.repository.interface';
import { CreateFollowUpDto } from '../dto/create-followup.dto';
import { FollowUpMapper } from '../mappers/followup.mapper';
import type { FollowUpRecord } from '../repositories/followup.repository.interface';
import type { FollowUpApplicationContext } from '../services/followup-application.types';
import { FollowUpService } from '../services/followup.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('deals/:dealId/followups')
export class DealFollowUpsController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ): Promise<ApiSuccessResponse<readonly FollowUpRecord[]>> {
    const scope = this.resolveScope(headers);
    const followUps = await this.followUpService.listFollowUps(scope, dealId);

    return successResponse(followUps);
  }

  @Post()
  @RequirePermissions('sales.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: CreateFollowUpDto,
  ): Promise<ApiSuccessResponse<FollowUpRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = FollowUpMapper.toCreateFollowUpCommand(dto);
    const followUp = await this.followUpService.createFollowUp(scope, dealId, command, context);

    return successResponse(followUp);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DealScope {
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
