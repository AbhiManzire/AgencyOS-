import { Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { ListSyncLogsQueryDto, ListSyncQueryDto } from '../dto/list-integrations-query.dto';
import type {
  IntegrationApplicationContext,
  IntegrationScope,
  IntegrationSyncJobView,
  IntegrationSyncLogView,
} from '../domain/integration-domain.types';
import { IntegrationMapper } from '../mappers/integration.mapper';
import { IntegrationService } from '../services/integration.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('integrations')
export class IntegrationSyncController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('connections/:id/sync')
  @RequirePermissions('integrations.manage')
  async sync(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<IntegrationSyncJobView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const job = await this.integrationService.sync(
      scope,
      id,
      IntegrationMapper.defaultManualTrigger(),
      context,
    );
    return successResponse(job);
  }

  @Get('connections/:id/sync-jobs')
  @RequirePermissions('integrations.read')
  async listSyncJobs(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: ListSyncQueryDto,
  ): Promise<ApiSuccessResponse<readonly IntegrationSyncJobView[]>> {
    const scope = this.resolveScope(headers);
    const query = IntegrationMapper.toListSyncQuery(queryDto);
    const result = await this.integrationService.listSyncJobs(scope, id, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('connections/:id/sync-logs')
  @RequirePermissions('integrations.read')
  async listConnectionSyncLogs(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() queryDto: ListSyncQueryDto,
  ): Promise<ApiSuccessResponse<readonly IntegrationSyncLogView[]>> {
    const scope = this.resolveScope(headers);
    const query = IntegrationMapper.toListSyncQuery(queryDto);
    const result = await this.integrationService.listSyncLogs(scope, {
      connectionId: id,
      ...query,
    });
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('sync-logs')
  @RequirePermissions('integrations.read')
  async listAllSyncLogs(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListSyncLogsQueryDto,
  ): Promise<ApiSuccessResponse<readonly IntegrationSyncLogView[]>> {
    const scope = this.resolveScope(headers);
    const query = IntegrationMapper.toListSyncLogsQuery(queryDto);
    const result = await this.integrationService.listSyncLogs(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): IntegrationScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): IntegrationApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
