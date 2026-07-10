import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import type { QuoteScope } from '../../quotes/repositories/quote.repository.interface';
import { CreateQuoteLineItemDto } from '../dto/create-quote-line-item.dto';
import { QuoteLineItemMapper } from '../mappers/quote-line-item.mapper';
import type { QuoteLineItemRecord } from '../repositories/quote-line-item.repository.interface';
import type { QuoteLineItemApplicationContext } from '../services/quote-line-item-application.types';
import { QuoteLineItemService } from '../services/quote-line-item.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('quotes/:quoteId/items')
export class QuoteLineItemsController {
  constructor(private readonly quoteLineItemService: QuoteLineItemService) {}

  @Get()
  @RequirePermissions('quotes.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
  ): Promise<ApiSuccessResponse<readonly QuoteLineItemRecord[]>> {
    const scope = this.resolveScope(headers);
    const lineItems = await this.quoteLineItemService.listLineItems(scope, quoteId);

    return successResponse(lineItems);
  }

  @Post()
  @RequirePermissions('quotes.update')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('quoteId', ParseUUIDPipe) quoteId: string,
    @Body() dto: CreateQuoteLineItemDto,
  ): Promise<ApiSuccessResponse<QuoteLineItemRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = QuoteLineItemMapper.toCreateQuoteLineItemCommand(dto);
    const lineItem = await this.quoteLineItemService.createLineItem(
      scope,
      quoteId,
      command,
      context,
    );

    return successResponse(lineItem);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): QuoteScope {
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
