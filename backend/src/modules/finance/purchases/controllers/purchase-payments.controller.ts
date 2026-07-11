import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreatePurchasePaymentDto } from '../dto/create-purchase-payment.dto';
import { PurchaseBillMapper } from '../mappers/purchase-bill.mapper';
import type { PurchasePaymentRecord } from '../repositories/purchase-payment.repository.interface';
import type {
  PurchaseApplicationContext,
  PurchaseBillScope,
} from '../services/purchase-application.types';
import { PurchaseBillService } from '../services/purchase-bill.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('purchase-bills/:billId/payments')
export class PurchaseBillPaymentsController {
  constructor(private readonly purchaseBillService: PurchaseBillService) {}

  @Get()
  @RequirePermissions('finance.purchases.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('billId', ParseUUIDPipe) billId: string,
  ): Promise<ApiSuccessResponse<readonly PurchasePaymentRecord[]>> {
    const scope = this.resolveScope(headers);
    const payments = await this.purchaseBillService.listPayments(scope, billId);
    return successResponse(payments);
  }

  @Post()
  @RequirePermissions('finance.purchases.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('billId', ParseUUIDPipe) billId: string,
    @Body() dto: CreatePurchasePaymentDto,
  ): Promise<ApiSuccessResponse<PurchasePaymentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const payment = await this.purchaseBillService.createPayment(
      scope,
      billId,
      PurchaseBillMapper.toCreatePaymentCommand(dto),
      context,
    );
    return successResponse(payment);
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

@Controller('purchase-payments')
export class PurchasePaymentsController {
  constructor(private readonly purchaseBillService: PurchaseBillService) {}

  @Get(':id')
  @RequirePermissions('finance.purchases.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PurchasePaymentRecord>> {
    const scope = this.resolveScope(headers);
    const payment = await this.purchaseBillService.getPayment(scope, id);
    return successResponse(payment);
  }

  @Post(':id/void')
  @RequirePermissions('finance.purchases.update')
  async voidPayment(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PurchasePaymentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const payment = await this.purchaseBillService.voidPayment(scope, id, context);
    return successResponse(payment);
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
