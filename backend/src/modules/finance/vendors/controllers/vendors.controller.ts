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
import { CreateVendorDto } from '../dto/create-vendor.dto';
import { ListVendorsQueryDto } from '../dto/list-vendors-query.dto';
import { RestoreVendorDto } from '../dto/restore-vendor.dto';
import { UpdateVendorDto } from '../dto/update-vendor.dto';
import { VendorMapper } from '../mappers/vendor.mapper';
import type { VendorRecord } from '../repositories/vendor.repository.interface';
import type { VendorApplicationContext, VendorScope } from '../services/vendor-application.types';
import { VendorService } from '../services/vendor.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @RequirePermissions('finance.vendors.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateVendorDto,
  ): Promise<ApiSuccessResponse<VendorRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = VendorMapper.toCreateVendorCommand(dto);
    const vendor = await this.vendorService.createVendor(scope, command, context);
    return successResponse(vendor);
  }

  @Get()
  @RequirePermissions('finance.vendors.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListVendorsQueryDto,
  ): Promise<ApiSuccessResponse<readonly VendorRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = VendorMapper.toListVendorsQuery(queryDto);
    const result = await this.vendorService.listVendors(scope, query);
    return successResponse(result.items, {
      total: result.total,
      skip: query.skip ?? 0,
      take: query.take ?? 25,
    });
  }

  @Get(':id')
  @RequirePermissions('finance.vendors.read')
  async getById(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<VendorRecord>> {
    const scope = this.resolveScope(headers);
    const vendor = await this.vendorService.getVendor(scope, id);
    return successResponse(vendor);
  }

  @Patch(':id')
  @RequirePermissions('finance.vendors.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ): Promise<ApiSuccessResponse<VendorRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = VendorMapper.toUpdateVendorCommand(dto);
    const vendor = await this.vendorService.updateVendor(scope, id, command, context);
    return successResponse(vendor);
  }

  @Delete(':id')
  @RequirePermissions('finance.vendors.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<VendorRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const vendor = await this.vendorService.archiveVendor(scope, id, context);
    return successResponse(vendor);
  }

  @Post(':id/restore')
  @RequirePermissions('finance.vendors.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreVendorDto,
  ): Promise<ApiSuccessResponse<VendorRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = VendorMapper.toRestoreVendorCommand(dto);
    const vendor = await this.vendorService.restoreVendor(scope, id, command, context);
    return successResponse(vendor);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): VendorScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): VendorApplicationContext {
    return { actorUserId: this.readHeader(headers, USER_HEADER) };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
