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
import { ConvertDealToInvoiceDto } from '../dto/convert-deal-to-invoice.dto';
import { CreateDealDto } from '../dto/create-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { DealMapper } from '../mappers/deal.mapper';
import type { DealRecord } from '../repositories/deal.repository.interface';
import type {
  ConvertedInvoiceRecord,
  DealApplicationContext,
  DealScope,
} from '../services/deal-application.types';
import { DealService } from '../services/deal.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateDealDto,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = DealMapper.toCreateDealCommand(dto);
    const deal = await this.dealService.createDeal(scope, command, context);

    return successResponse(deal);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListDealsQueryDto,
  ): Promise<ApiSuccessResponse<readonly DealRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = DealMapper.toListDealsQuery(queryDto);
    const result = await this.dealService.listDeals(scope, query);

    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('sales.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const deal = await this.dealService.getDeal(scope, id);

    return successResponse(deal);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = DealMapper.toUpdateDealCommand(dto);
    const deal = await this.dealService.updateDeal(scope, id, command, context);

    return successResponse(deal);
  }

  @Post(':id/archive')
  @RequirePermissions('sales.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const deal = await this.dealService.archiveDeal(scope, id, context);

    return successResponse(deal);
  }

  @Post(':id/restore')
  @RequirePermissions('sales.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const deal = await this.dealService.restoreDeal(scope, id, context);

    return successResponse(deal);
  }

  @Post(':id/convert-to-project')
  @RequirePermissions('sales.update')
  async convertToProject(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<DealRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const deal = await this.dealService.convertToProject(scope, id, context);

    return successResponse(deal);
  }

  @Post(':id/convert-to-invoice')
  @RequirePermissions('sales.update')
  async convertToInvoice(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertDealToInvoiceDto,
  ): Promise<ApiSuccessResponse<ConvertedInvoiceRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = DealMapper.toConvertDealToInvoiceCommand(dto);
    const invoice = await this.dealService.convertToInvoice(scope, id, command, context);

    return successResponse(invoice);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): DealScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): DealApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
