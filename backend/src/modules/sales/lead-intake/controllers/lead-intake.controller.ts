import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { LeadRecord } from '../../leads/repositories/lead.repository.interface';
import type { LeadScope } from '../../leads/services/lead-application.types';
import type { LeadIntakeProviderSummary } from '../lead-intake.types';
import { LeadIntakeService, type LeadIntakeContext } from '../services/lead-intake.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('leads/intake')
export class LeadIntakeController {
  constructor(private readonly leadIntakeService: LeadIntakeService) {}

  @Get('providers')
  @RequirePermissions('sales.read')
  listProviders(): Promise<ApiSuccessResponse<readonly LeadIntakeProviderSummary[]>> {
    return Promise.resolve(successResponse(this.leadIntakeService.listProviders()));
  }

  @Post(':providerKey')
  @RequirePermissions('sales.create')
  async ingest(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('providerKey') providerKey: string,
    @Body() payload: unknown,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lead = await this.leadIntakeService.ingest(scope, providerKey, payload, context);

    return successResponse(lead);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): LeadScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): LeadIntakeContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
