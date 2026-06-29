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
import { Public } from '../../../../common/decorators/public.decorator';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { ListQuotesQueryDto } from '../dto/list-quotes-query.dto';
import { UpdateQuoteDto } from '../dto/update-quote.dto';
import { QuoteMapper } from '../mappers/quote.mapper';
import type { QuoteRecord } from '../repositories/quote.repository.interface';
import type { QuoteApplicationContext, QuoteScope } from '../services/quote-application.types';
import { QuoteService } from '../services/quote.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Public()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @RequirePermissions('quotes.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateQuoteDto,
  ): Promise<ApiSuccessResponse<QuoteRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = QuoteMapper.toCreateQuoteCommand(dto);
    const quote = await this.quoteService.createQuote(scope, command, context);

    return successResponse(quote);
  }

  @Get()
  @RequirePermissions('quotes.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListQuotesQueryDto,
  ): Promise<ApiSuccessResponse<readonly QuoteRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = QuoteMapper.toListQuotesQuery(queryDto);
    const result = await this.quoteService.listQuotes(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('quotes.read')
  async getOne(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<QuoteRecord>> {
    const scope = this.resolveScope(headers);
    const quote = await this.quoteService.getQuote(scope, id);

    return successResponse(quote);
  }

  @Patch(':id')
  @RequirePermissions('quotes.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<ApiSuccessResponse<QuoteRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = QuoteMapper.toUpdateQuoteCommand(dto);
    const quote = await this.quoteService.updateQuote(scope, id, command, context);

    return successResponse(quote);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): QuoteScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): QuoteApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
