import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { successResponse } from '../../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../../common/http/api-response.types';
import { RequirePermissions } from '../../../../rbac/decorators/require-permissions.decorator';
import { LeadImportExportService } from '../../import-export/services/lead-import-export.service';
import type { LeadApplicationContext, LeadScope } from '../../services/lead-application.types';
import {
  BulkAddTagsDto,
  BulkAssignOwnerDto,
  BulkChangeStatusDto,
  BulkDeleteLeadsDto,
  BulkExportLeadsDto,
} from '../dto/bulk-leads.dto';
import type { BulkActionResult } from '../lead-bulk.types';
import { LeadBulkService } from '../services/lead-bulk.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('leads/bulk')
export class LeadBulkController {
  constructor(
    private readonly leadBulkService: LeadBulkService,
    private readonly leadImportExportService: LeadImportExportService,
  ) {}

  @Post('assign-owner')
  @RequirePermissions('sales.update')
  async assignOwner(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: BulkAssignOwnerDto,
  ): Promise<ApiSuccessResponse<BulkActionResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.leadBulkService.assignOwner(
      scope,
      { leadIds: dto.leadIds, assignedToUserId: dto.assignedToUserId },
      context,
    );
    return successResponse(result);
  }

  @Post('change-status')
  @RequirePermissions('sales.update')
  async changeStatus(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: BulkChangeStatusDto,
  ): Promise<ApiSuccessResponse<BulkActionResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.leadBulkService.changeStatus(
      scope,
      { leadIds: dto.leadIds, status: dto.status },
      context,
    );
    return successResponse(result);
  }

  @Post('add-tags')
  @RequirePermissions('sales.update')
  async addTags(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: BulkAddTagsDto,
  ): Promise<ApiSuccessResponse<BulkActionResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.leadBulkService.addTags(
      scope,
      { leadIds: dto.leadIds, tagNames: dto.tagNames },
      context,
    );
    return successResponse(result);
  }

  @Post('delete')
  @RequirePermissions('sales.update')
  async deleteLeads(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: BulkDeleteLeadsDto,
  ): Promise<ApiSuccessResponse<BulkActionResult>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.leadBulkService.deleteLeads(scope, { leadIds: dto.leadIds }, context);
    return successResponse(result);
  }

  @Post('export')
  @RequirePermissions('sales.read')
  async exportLeads(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: BulkExportLeadsDto,
    @Res() response: Response,
  ): Promise<void> {
    const scope = this.resolveScope(headers);
    const exported = await this.leadImportExportService.exportLeads(scope, {
      format: dto.format,
      mode: 'selected',
      leadIds: dto.leadIds,
    });

    response.setHeader('Content-Type', exported.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(exported.filename)}"`,
    );
    response.send(exported.buffer);
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
