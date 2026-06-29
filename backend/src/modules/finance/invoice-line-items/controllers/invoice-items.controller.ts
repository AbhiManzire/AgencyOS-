import { Body, Controller, Delete, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { Public } from '../../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { UpdateInvoiceLineItemDto } from '../dto/update-invoice-line-item.dto';
import { InvoiceLineItemMapper } from '../mappers/invoice-line-item.mapper';
import type { InvoiceLineItemRecord } from '../repositories/invoice-line-item.repository.interface';
import type {
  InvoiceLineItemApplicationContext,
  InvoiceLineItemScope,
} from '../services/invoice-line-item-application.types';
import { InvoiceLineItemService } from '../services/invoice-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('invoice-items')
export class InvoiceItemsController {
  constructor(private readonly invoiceLineItemService: InvoiceLineItemService) {}

  @Patch(':id')
  @RequirePermissions('invoices.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceLineItemDto,
  ): Promise<ApiSuccessResponse<InvoiceLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = InvoiceLineItemMapper.toUpdateInvoiceLineItemCommand(dto);
    const lineItem = await this.invoiceLineItemService.updateLineItem(scope, id, command, context);

    return successResponse(lineItem);
  }

  @Delete(':id')
  @RequirePermissions('invoices.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<InvoiceLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lineItem = await this.invoiceLineItemService.deleteLineItem(scope, id, context);

    return successResponse(lineItem);
  }

  private resolveScope(
    headers: Record<string, string | string[] | undefined>,
  ): InvoiceLineItemScope {
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
