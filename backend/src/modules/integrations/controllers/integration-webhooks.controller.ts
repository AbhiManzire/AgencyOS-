import { Body, Controller, Headers, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import type { IntegrationScope } from '../domain/integration-domain.types';
import { IntegrationService } from '../services/integration.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

/**
 * Architecture receive endpoint for Integration Hub incoming webhooks.
 * Uses the same x-tenant-id / x-workspace-id headers for tenant scope.
 * Signature is validated by WebhookEngineService (HMAC-SHA256) when a secret is configured.
 */
@Controller('integrations/webhooks')
export class IntegrationWebhooksController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('incoming/:endpointPath')
  @RequirePermissions('integrations.manage')
  async receiveIncoming(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('endpointPath') endpointPath: string,
    @Body() body: unknown,
    @Req() req: Request & { rawBody?: Buffer | string },
  ): Promise<
    ApiSuccessResponse<{
      accepted: boolean;
      deliveryId: string;
      result: unknown;
    }>
  > {
    const scope = this.resolveScope(headers);
    const rawBody = req.rawBody ?? (typeof body === 'string' ? body : JSON.stringify(body ?? {}));

    const result = await this.integrationService.receiveWebhook(scope, endpointPath, {
      rawBody,
      parsedPayload: body,
      headers,
    });

    return successResponse(result);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): IntegrationScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
