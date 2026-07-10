import { Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { AssignClientTagDto } from '../dto/assign-client-tag.dto';
import type { ClientScope } from '../repositories/client.repository.interface';
import type {
  ClientTagApplicationContext,
  ClientTagResponse,
} from '../services/client-tag-application.types';
import { ClientTagService } from '../services/client-tag.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('clients/:clientId/tags')
export class ClientTagsController {
  constructor(private readonly clientTagService: ClientTagService) {}

  @Get()
  @RequirePermissions('clients.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
  ): Promise<ApiSuccessResponse<readonly ClientTagResponse[]>> {
    const scope = this.resolveScope(headers);
    const tags = await this.clientTagService.listTags(scope, clientId);
    return successResponse(tags);
  }

  @Post()
  @RequirePermissions('clients.update')
  async assign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Body() dto: AssignClientTagDto,
  ): Promise<ApiSuccessResponse<ClientTagResponse>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const tag = await this.clientTagService.assignTag(
      scope,
      clientId,
      {
        name: dto.name,
        colorToken: dto.colorToken,
      },
      context,
    );
    return successResponse(tag);
  }

  @Delete(':tagId')
  @RequirePermissions('clients.update')
  async unassign(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ): Promise<ApiSuccessResponse<{ readonly tagId: string }>> {
    const scope = this.resolveScope(headers);
    await this.clientTagService.unassignTag(scope, clientId, tagId);
    return successResponse({ tagId });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ClientScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): ClientTagApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
