import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { ListInvoicesQueryDto } from '../dto/list-invoices-query.dto';
import { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import { InvoiceMapper } from '../mappers/invoice.mapper';
import type { InvoiceRecord } from '../repositories/invoice.repository.interface';
import type {
  InvoiceApplicationContext,
  InvoiceScope,
} from '../services/invoice-application.types';
import { InvoiceService } from '../services/invoice.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermissions('invoices.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateInvoiceDto,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = InvoiceMapper.toCreateInvoiceCommand(dto);
    const invoice = await this.invoiceService.createInvoice(scope, command, context);

    return successResponse(invoice);
  }

  @Get()
  @RequirePermissions('invoices.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListInvoicesQueryDto,
  ): Promise<ApiSuccessResponse<readonly InvoiceRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = InvoiceMapper.toListInvoicesQuery(queryDto);
    const result = await this.invoiceService.listInvoices(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('invoices.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const invoice = await this.invoiceService.getInvoice(scope, id);

    return successResponse(invoice);
  }

  @Patch(':id')
  @RequirePermissions('invoices.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = InvoiceMapper.toUpdateInvoiceCommand(dto);
    const invoice = await this.invoiceService.updateInvoice(scope, id, command, context);

    return successResponse(invoice);
  }

  @Post(':id/mark-viewed')
  @RequirePermissions('invoices.update')
  async markViewed(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const invoice = await this.invoiceService.markViewed(scope, id, context);
    return successResponse(invoice);
  }

  @Post(':id/cancel')
  @RequirePermissions('invoices.update')
  async cancel(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const invoice = await this.invoiceService.cancelInvoice(scope, id, context);
    return successResponse(invoice);
  }

  @Post(':id/approve')
  @RequirePermissions('invoices.update')
  async approve(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const invoice = await this.invoiceService.approveInvoice(scope, id, context);
    return successResponse(invoice);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): InvoiceScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): InvoiceApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
