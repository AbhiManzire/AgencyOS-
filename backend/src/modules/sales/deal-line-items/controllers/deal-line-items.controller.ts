import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { DealScope } from '../../deals/repositories/deal.repository.interface';
import { CreateDealLineItemDto } from '../dto/create-deal-line-item.dto';
import { DealLineItemMapper } from '../mappers/deal-line-item.mapper';
import type { DealLineItemRecord } from '../repositories/deal-line-item.repository.interface';
import type { DealLineItemApplicationContext } from '../services/deal-line-item-application.types';
import { DealLineItemService } from '../services/deal-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('deals/:dealId/line-items')
export class DealLineItemsController {
  constructor(private readonly dealLineItemService: DealLineItemService) {}

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
  ): Promise<ApiSuccessResponse<readonly DealLineItemRecord[]>> {
    const scope = this.resolveScope(headers);
    const lineItems = await this.dealLineItemService.listLineItems(scope, dealId);
    return successResponse(lineItems);
  }

  @Post()
  @RequirePermissions('sales.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('dealId', ParseUUIDPipe) dealId: string,
    @Body() dto: CreateDealLineItemDto,
  ): Promise<ApiSuccessResponse<DealLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = DealLineItemMapper.toCreateDealLineItemCommand(dto);
    const lineItem = await this.dealLineItemService.createLineItem(scope, dealId, command, context);
    return successResponse(lineItem);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DealScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): DealLineItemApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
