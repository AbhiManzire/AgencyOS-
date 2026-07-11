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
import { CreateLeadDto } from '../dto/create-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
import { RestoreLeadDto } from '../dto/restore-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';
import type { LeadRecord } from '../repositories/lead.repository.interface';
import type { LeadApplicationContext, LeadScope } from '../services/lead-application.types';
import { LeadService } from '../services/lead.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateLeadDto,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = LeadMapper.toCreateLeadCommand(dto);
    const lead = await this.leadService.createLead(scope, command, context);

    return successResponse(lead);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListLeadsQueryDto,
  ): Promise<ApiSuccessResponse<readonly LeadRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = LeadMapper.toListLeadsQuery(queryDto);
    const result = await this.leadService.listLeads(scope, query);

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
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const lead = await this.leadService.getLead(scope, id);

    return successResponse(lead);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = LeadMapper.toUpdateLeadCommand(dto);
    const lead = await this.leadService.updateLead(scope, id, command, context);

    return successResponse(lead);
  }

  @Delete(':id')
  @RequirePermissions('sales.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lead = await this.leadService.archiveLead(scope, id, context);

    return successResponse(lead);
  }

  @Post(':id/restore')
  @RequirePermissions('sales.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreLeadDto,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = LeadMapper.toRestoreLeadCommand(dto);
    const lead = await this.leadService.restoreLead(scope, id, command, context);

    return successResponse(lead);
  }

  @Post(':id/convert')
  @RequirePermissions('sales.update')
  async convert(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<LeadRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const lead = await this.leadService.convertLead(scope, id, context);

    return successResponse(lead);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): LeadScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): LeadApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
