import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../../rbac/decorators/require-permissions.decorator';
import type { DealScope } from '../../repositories/deal.repository.interface';
import { AssignDealTagDto } from '../dto/assign-deal-tag.dto';
import type {
  DealTagApplicationContext,
  DealTagResponse,
} from '../services/deal-tag-application.types';
import { DealTagService } from '../services/deal-tag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('deals/:dealId/tags')
export class DealTagsController {
  constructor(private readonly dealTagService: DealTagService) {}

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ): Promise<ApiSuccessResponse<readonly DealTagResponse[]>> {
    const scope = this.resolveScope(headers);
    const tags = await this.dealTagService.listTags(scope, dealId);
    return successResponse(tags);
  }

  @Post()
  @RequirePermissions('sales.update')
  async assign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: AssignDealTagDto,
  ): Promise<ApiSuccessResponse<DealTagResponse>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const tag = await this.dealTagService.assignTag(
      scope,
      dealId,
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
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<ApiSuccessResponse<{ readonly tagId: string }>> {
    const scope = this.resolveScope(headers);
    await this.dealTagService.unassignTag(scope, dealId, tagId);
    return successResponse({ tagId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DealScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): DealTagApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
