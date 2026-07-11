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
  Query,
} from '@nestjs/common';
import { successResponse } from '../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { CreatePurchaseBillDto } from '../dto/create-purchase-bill.dto';
import { ListPurchaseBillsQueryDto } from '../dto/list-purchase-bills-query.dto';
import { UpdatePurchaseBillDto } from '../dto/update-purchase-bill.dto';
import { PurchaseBillMapper } from '../mappers/purchase-bill.mapper';
import type { PurchaseBillRecord } from '../repositories/purchase-bill.repository.interface';
import type {
  PurchaseApplicationContext,
  PurchaseBillScope,
} from '../services/purchase-application.types';
import { PurchaseBillService } from '../services/purchase-bill.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('purchase-bills')
export class PurchaseBillsController {
  constructor(private readonly purchaseBillService: PurchaseBillService) {}

  @Post()
  @RequirePermissions('finance.purchases.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreatePurchaseBillDto,
  ): Promise<ApiSuccessResponse<PurchaseBillRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const bill = await this.purchaseBillService.createBill(
      scope,
      PurchaseBillMapper.toCreateBillCommand(dto),
      context,
    );
    return successResponse(bill);
  }

  @Get()
  @RequirePermissions('finance.purchases.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListPurchaseBillsQueryDto,
  ): Promise<ApiSuccessResponse<readonly PurchaseBillRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = PurchaseBillMapper.toListBillsQuery(queryDto);
    const result = await this.purchaseBillService.listBills(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('finance.purchases.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PurchaseBillRecord>> {
    const scope = this.resolveScope(headers);
    const bill = await this.purchaseBillService.getBill(scope, id);
    return successResponse(bill);
  }

  @Patch(':id')
  @RequirePermissions('finance.purchases.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseBillDto,
  ): Promise<ApiSuccessResponse<PurchaseBillRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const bill = await this.purchaseBillService.updateBill(
      scope,
      id,
      PurchaseBillMapper.toUpdateBillCommand(dto),
      context,
    );
    return successResponse(bill);
  }

  @Delete(':id')
  @RequirePermissions('finance.purchases.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<PurchaseBillRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const bill = await this.purchaseBillService.archiveBill(scope, id, context);
    return successResponse(bill);
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
