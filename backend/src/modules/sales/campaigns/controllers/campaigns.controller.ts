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
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { ListCampaignsQueryDto } from '../dto/list-campaigns-query.dto';
import { RestoreCampaignDto } from '../dto/restore-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { CampaignMapper } from '../mappers/campaign.mapper';
import type { CampaignRecord } from '../repositories/campaign.repository.interface';
import type {
  CampaignApplicationContext,
  CampaignScope,
} from '../services/campaign-application.types';
import { CampaignService } from '../services/campaign.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @RequirePermissions('sales.create')
  async create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CreateCampaignDto,
  ): Promise<ApiSuccessResponse<CampaignRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = CampaignMapper.toCreateCampaignCommand(dto);
    const campaign = await this.campaignService.createCampaign(scope, command, context);

    return successResponse(campaign);
  }

  @Get()
  @RequirePermissions('sales.read')
  async list(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() queryDto: ListCampaignsQueryDto,
  ): Promise<ApiSuccessResponse<readonly CampaignRecord[]>> {
    const scope = this.resolveScope(headers);
    const query = CampaignMapper.toListCampaignsQuery(queryDto);
    const result = await this.campaignService.listCampaigns(scope, query);

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
  ): Promise<ApiSuccessResponse<CampaignRecord>> {
    const scope = this.resolveScope(headers);
    const campaign = await this.campaignService.getCampaign(scope, id);

    return successResponse(campaign);
  }

  @Patch(':id')
  @RequirePermissions('sales.update')
  async update(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ): Promise<ApiSuccessResponse<CampaignRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = CampaignMapper.toUpdateCampaignCommand(dto);
    const campaign = await this.campaignService.updateCampaign(scope, id, command, context);

    return successResponse(campaign);
  }

  @Delete(':id')
  @RequirePermissions('sales.update')
  async archive(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<CampaignRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const campaign = await this.campaignService.archiveCampaign(scope, id, context);

    return successResponse(campaign);
  }

  @Post(':id/restore')
  @RequirePermissions('sales.update')
  async restore(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestoreCampaignDto,
  ): Promise<ApiSuccessResponse<CampaignRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = CampaignMapper.toRestoreCampaignCommand(dto);
    const campaign = await this.campaignService.restoreCampaign(scope, id, command, context);

    return successResponse(campaign);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): CampaignScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): CampaignApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
