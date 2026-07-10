import { Body, Controller, Delete, Headers, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { UpdateQuoteLineItemDto } from '../dto/update-quote-line-item.dto';
import { QuoteLineItemMapper } from '../mappers/quote-line-item.mapper';
import type { QuoteLineItemRecord } from '../repositories/quote-line-item.repository.interface';
import type {
  QuoteLineItemApplicationContext,
  QuoteLineItemScope,
} from '../services/quote-line-item-application.types';
import { QuoteLineItemService } from '../services/quote-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('quote-items')
export class QuoteItemsController {
  constructor(private readonly quoteLineItemService: QuoteLineItemService) {}

  @Patch(':id')
  @RequirePermissions('quotes.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuoteLineItemDto,
  ): Promise<ApiSuccessResponse<QuoteLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = QuoteLineItemMapper.toUpdateQuoteLineItemCommand(dto);
    const lineItem = await this.quoteLineItemService.updateLineItem(scope, id, command, context);

    return successResponse(lineItem);
  }

  @Delete(':id')
  @RequirePermissions('quotes.update')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<QuoteLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lineItem = await this.quoteLineItemService.deleteLineItem(scope, id, context);

    return successResponse(lineItem);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): QuoteLineItemScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): QuoteLineItemApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
