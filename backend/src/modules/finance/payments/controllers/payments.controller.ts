import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ListPaymentsQueryDto } from '../dto/list-payments-query.dto';
import type {
  InvoicePaymentSummary,
  PaymentApplicationContext,
  PaymentRecord,
  PaymentScope,
} from '../services/payment-application.types';
import { PaymentService } from '../services/payment.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermissions('invoices.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListPaymentsQueryDto,
  ): Promise<ApiSuccessResponse<readonly PaymentRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.paymentService.listPayments(scope, {
      skip: queryDto.skip,
      take: queryDto.take,
      invoiceId: queryDto.invoiceId,
      status: queryDto.status,
    });

    return successResponse(result.items, {
      total: result.total,
      skip: queryDto.skip ?? 0,
      take: queryDto.take ?? 25,
    });
  }

  @Post()
  @RequirePermissions('invoices.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreatePaymentDto,
  ): Promise<ApiSuccessResponse<PaymentRecord>> {
    if (dto.invoiceId === undefined) {
      throw new BadRequestException('invoiceId is required.');
    }

    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const payment = await this.paymentService.createPayment(
      scope,
      {
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        method: dto.method,
        paidAt: dto.paidAt,
        currency: dto.currency,
        reference: dto.reference,
        notes: dto.notes,
        approvalStatus: dto.approvalStatus,
      },
      context,
    );

    return successResponse(payment);
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PaymentRecord>> {
    const scope = this.resolveScope(headers);
    const payment = await this.paymentService.getPayment(scope, id);
    return successResponse(payment);
  }

  @Post(':id/void')
  @RequirePermissions('invoices.update')
  async voidPayment(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PaymentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const payment = await this.paymentService.voidPayment(scope, id, context);
    return successResponse(payment);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): PaymentScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): PaymentApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}

@Controller('invoices/:invoiceId/payments')
export class InvoicePaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @RequirePermissions('invoices.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<ApiSuccessResponse<readonly PaymentRecord[]>> {
    const scope = this.resolveScope(headers);
    const result = await this.paymentService.listPayments(scope, {
      invoiceId,
      take: 100,
    });
    return successResponse(result.items, { total: result.total });
  }

  @Get('summary')
  @RequirePermissions('invoices.read')
  async summary(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<ApiSuccessResponse<InvoicePaymentSummary>> {
    const scope = this.resolveScope(headers);
    const summary = await this.paymentService.getInvoicePaymentSummary(scope, invoiceId);
    return successResponse(summary);
  }

  @Post()
  @RequirePermissions('invoices.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<ApiSuccessResponse<PaymentRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const payment = await this.paymentService.createPayment(
      scope,
      {
        invoiceId,
        amount: dto.amount,
        method: dto.method,
        paidAt: dto.paidAt,
        currency: dto.currency,
        reference: dto.reference,
        notes: dto.notes,
        approvalStatus: dto.approvalStatus,
      },
      context,
    );
    return successResponse(payment);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): PaymentScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): PaymentApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
