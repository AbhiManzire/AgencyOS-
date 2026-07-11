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
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import {
  CreatePurchaseBillLineItemDto,
  UpdatePurchaseBillLineItemDto,
} from '../dto/create-purchase-bill-line-item.dto';
import { PurchaseBillMapper } from '../mappers/purchase-bill.mapper';
import type { PurchaseBillLineItemRecord } from '../repositories/purchase-bill-line-item.repository.interface';
import type {
  PurchaseApplicationContext,
  PurchaseBillScope,
} from '../services/purchase-application.types';
import { PurchaseBillService } from '../services/purchase-bill.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('purchase-bills/:billId/items')
export class PurchaseBillItemsController {
  constructor(private readonly purchaseBillService: PurchaseBillService) {}

  @Get()
  @RequirePermissions('finance.purchases.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('billId', ParseUUIDPipe) billId: string,
  ): Promise<ApiSuccessResponse<readonly PurchaseBillLineItemRecord[]>> {
    const scope = this.resolveScope(headers);
    const items = await this.purchaseBillService.listLineItems(scope, billId);
    return successResponse(items);
  }

  @Post()
  @RequirePermissions('finance.purchases.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('billId', ParseUUIDPipe) billId: string,
    @Body() dto: CreatePurchaseBillLineItemDto,
  ): Promise<ApiSuccessResponse<PurchaseBillLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const item = await this.purchaseBillService.createLineItem(
      scope,
      billId,
      PurchaseBillMapper.toCreateLineItemCommand(dto),
      context,
    );
    return successResponse(item);
  }

  @Patch(':id')
  @RequirePermissions('finance.purchases.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseBillLineItemDto,
  ): Promise<ApiSuccessResponse<PurchaseBillLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const item = await this.purchaseBillService.updateLineItem(
      scope,
      id,
      PurchaseBillMapper.toUpdateLineItemCommand(dto),
      context,
    );
    return successResponse(item);
  }

  @Delete(':id')
  @RequirePermissions('finance.purchases.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PurchaseBillLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const item = await this.purchaseBillService.deleteLineItem(scope, id, context);
    return successResponse(item);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): PurchaseBillScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): PurchaseApplicationContext {
    return { actorUserId: this.readHeader(headers, USER_HEADER) };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
