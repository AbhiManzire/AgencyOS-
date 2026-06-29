import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { Public } from '../../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { InvoiceScope } from '../../invoices/repositories/invoice.repository.interface';
import { CreateInvoiceLineItemDto } from '../dto/create-invoice-line-item.dto';
import { InvoiceLineItemMapper } from '../mappers/invoice-line-item.mapper';
import type { InvoiceLineItemRecord } from '../repositories/invoice-line-item.repository.interface';
import type { InvoiceLineItemApplicationContext } from '../services/invoice-line-item-application.types';
import { InvoiceLineItemService } from '../services/invoice-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('invoices/:invoiceId/items')
export class InvoiceLineItemsController {
  constructor(private readonly invoiceLineItemService: InvoiceLineItemService) {}

  @Get()
  @RequirePermissions('invoices.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<ApiSuccessResponse<readonly InvoiceLineItemRecord[]>> {
    const scope = this.resolveScope(headers);
    const lineItems = await this.invoiceLineItemService.listLineItems(scope, invoiceId);

    return successResponse(lineItems);
  }

  @Post()
  @RequirePermissions('invoices.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreateInvoiceLineItemDto,
  ): Promise<ApiSuccessResponse<InvoiceLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = InvoiceLineItemMapper.toCreateInvoiceLineItemCommand(dto);
    const lineItem = await this.invoiceLineItemService.createLineItem(
      scope,
      invoiceId,
      command,
      context,
    );

    return successResponse(lineItem);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): InvoiceScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): InvoiceLineItemApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
