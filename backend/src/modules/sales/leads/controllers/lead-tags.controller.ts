import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { AssignLeadTagDto } from '../dto/assign-lead-tag.dto';
import type { LeadScope } from '../repositories/lead.repository.interface';
import type {
  LeadTagApplicationContext,
  LeadTagResponse,
} from '../services/lead-tag-application.types';
import { LeadTagService } from '../services/lead-tag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('leads/:leadId/tags')
export class LeadTagsController {
  constructor(private readonly leadTagService: LeadTagService) {}

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ): Promise<ApiSuccessResponse<readonly LeadTagResponse[]>> {
    const scope = this.resolveScope(headers);
    const tags = await this.leadTagService.listTags(scope, leadId);
    return successResponse(tags);
  }

  @Post()
  @RequirePermissions('sales.update')
  async assign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() dto: AssignLeadTagDto,
  ): Promise<ApiSuccessResponse<LeadTagResponse>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const tag = await this.leadTagService.assignTag(
      scope,
      leadId,
      {
        name: dto.name,
        colorToken: dto.colorToken,
      },
      context,
    );
    return successResponse(tag);
  }

  @Delete(':tagId')
  @RequirePermissions('sales.update')
  async unassign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<ApiSuccessResponse<{ readonly tagId: string }>> {
    const scope = this.resolveScope(headers);
    await this.leadTagService.unassignTag(scope, leadId, tagId);
    return successResponse({ tagId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): LeadScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): LeadTagApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
