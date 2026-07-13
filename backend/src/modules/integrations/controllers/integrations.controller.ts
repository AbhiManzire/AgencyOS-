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
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { ConnectConnectionDto } from '../dto/connect-connection.dto';
import { CreateConnectionDto } from '../dto/create-connection.dto';
import {
  ListConnectionsQueryDto,
  ListWebhookDeliveriesQueryDto,
} from '../dto/list-integrations-query.dto';
import { UpdateConnectionDto } from '../dto/update-connection.dto';
import { CreateWebhookDto, SendWebhookDto, UpdateWebhookDto } from '../dto/webhook.dto';
import type {
  IntegrationApplicationContext,
  IntegrationCatalogEntry,
  IntegrationConnectionView,
  IntegrationHealthDashboard,
  IntegrationScope,
  IntegrationWebhookDeliveryView,
  IntegrationWebhookView,
} from '../domain/integration-domain.types';
import { IntegrationMapper } from '../mappers/integration.mapper';
import { IntegrationService } from '../services/integration.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('catalog')
  @RequirePermissions('integrations.read')
  listCatalog(): ApiSuccessResponse<readonly IntegrationCatalogEntry[]> {
    return successResponse(this.integrationService.listCatalog());
  }

  @Get('health/dashboard')
  @RequirePermissions('integrations.read')
  async healthDashboard(
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<ApiSuccessResponse<IntegrationHealthDashboard>> {
    const scope = this.resolveScope(headers);
    const dashboard = await this.integrationService.healthDashboard(scope);
    return successResponse(dashboard);
  }

  @Get('webhooks/deliveries')
  @RequirePermissions('integrations.read')
  async listWebhookDeliveries(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListWebhookDeliveriesQueryDto,
  ): Promise<ApiSuccessResponse<readonly IntegrationWebhookDeliveryView[]>> {
    const scope = this.resolveScope(headers);
    const query = IntegrationMapper.toListWebhookDeliveriesQuery(queryDto);
    const result = await this.integrationService.listWebhookDeliveries(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get('connections')
  @RequirePermissions('integrations.read')
  async listConnections(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListConnectionsQueryDto,
  ): Promise<ApiSuccessResponse<readonly IntegrationConnectionView[]>> {
    const scope = this.resolveScope(headers);
    const query = IntegrationMapper.toListConnectionsQuery(queryDto);
    const result = await this.integrationService.listConnections(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Post('connections')
  @RequirePermissions('integrations.manage')
  async createConnection(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateConnectionDto,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = IntegrationMapper.toCreateConnectionCommand(dto);
    const connection = await this.integrationService.createConnection(scope, command, context);
    return successResponse(connection);
  }

  @Get('connections/:id')
  @RequirePermissions('integrations.read')
  async getConnection(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const connection = await this.integrationService.getConnection(scope, id);
    return successResponse(connection);
  }

  @Patch('connections/:id')
  @RequirePermissions('integrations.manage')
  async updateConnection(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConnectionDto,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = IntegrationMapper.toUpdateConnectionCommand(dto);
    const connection = await this.integrationService.updateConnection(scope, id, command, context);
    return successResponse(connection);
  }

  @Delete('connections/:id')
  @RequirePermissions('integrations.manage')
  async archiveConnection(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const connection = await this.integrationService.archiveConnection(scope, id, context);
    return successResponse(connection);
  }

  @Post('connections/:id/connect')
  @RequirePermissions('integrations.manage')
  async connect(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConnectConnectionDto,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const credentials = IntegrationMapper.toConnectCredentials(dto);
    const connection = await this.integrationService.connect(scope, id, credentials, context);
    return successResponse(connection);
  }

  @Post('connections/:id/disconnect')
  @RequirePermissions('integrations.manage')
  async disconnect(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<IntegrationConnectionView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const connection = await this.integrationService.disconnect(scope, id, context);
    return successResponse(connection);
  }

  @Get('connections/:id/health')
  @RequirePermissions('integrations.read')
  async connectionHealth(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<
    ApiSuccessResponse<{
      connection: IntegrationConnectionView;
      healthy: boolean;
      details: Record<string, unknown>;
    }>
  > {
    const scope = this.resolveScope(headers);
    const result = await this.integrationService.health(scope, id);
    return successResponse(result);
  }

  @Get('connections/:id/webhooks')
  @RequirePermissions('integrations.read')
  async listWebhooks(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<readonly IntegrationWebhookView[]>> {
    const scope = this.resolveScope(headers);
    const webhooks = await this.integrationService.listWebhooks(scope, id);
    return successResponse(webhooks);
  }

  @Post('connections/:id/webhooks')
  @RequirePermissions('integrations.manage')
  async createWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWebhookDto,
  ): Promise<ApiSuccessResponse<IntegrationWebhookView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = IntegrationMapper.toCreateWebhookCommand(dto);
    const webhook = await this.integrationService.createWebhook(scope, id, command, context);
    return successResponse(webhook);
  }

  @Patch('connections/:connectionId/webhooks/:webhookId')
  @RequirePermissions('integrations.manage')
  async updateWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ): Promise<ApiSuccessResponse<IntegrationWebhookView>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = IntegrationMapper.toUpdateWebhookCommand(dto);
    const webhook = await this.integrationService.updateWebhook(
      scope,
      connectionId,
      webhookId,
      command,
      context,
    );
    return successResponse(webhook);
  }

  @Delete('connections/:connectionId/webhooks/:webhookId')
  @RequirePermissions('integrations.manage')
  async deleteWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
  ): Promise<ApiSuccessResponse<IntegrationWebhookView>> {
    const scope = this.resolveScope(headers);
    const webhook = await this.integrationService.deleteWebhook(scope, connectionId, webhookId);
    return successResponse(webhook);
  }

  @Post('connections/:connectionId/webhooks/:webhookId/send')
  @RequirePermissions('integrations.manage')
  async sendWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @Param('webhookId', ParseUUIDPipe) webhookId: string,
    @Body() dto: SendWebhookDto,
  ): Promise<ApiSuccessResponse<IntegrationWebhookDeliveryView>> {
    const scope = this.resolveScope(headers);
    const payload = IntegrationMapper.toSendWebhookPayload(dto);
    const delivery = await this.integrationService.sendWebhook(
      scope,
      connectionId,
      webhookId,
      payload,
    );
    return successResponse(delivery);
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
