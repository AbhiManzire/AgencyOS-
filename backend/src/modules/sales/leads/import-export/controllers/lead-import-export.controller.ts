import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { successResponse } from '../../../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../../../common/http/api-response.types';
import type { UploadedFilePayload } from '../../../../files/types/uploaded-file.types';
import { RequirePermissions } from '../../../../rbac/decorators/require-permissions.decorator';
import { LEAD_SOURCE_CATALOG } from '../../lead-source.catalog';
import type { LeadApplicationContext, LeadScope } from '../../services/lead-application.types';
import { CommitLeadImportDto } from '../dto/commit-lead-import.dto';
import { ExportLeadsDto } from '../dto/export-leads.dto';
import type {
  DuplicateStrategy,
  ImportPreviewResult,
  ImportSummary,
} from '../lead-import-export.types';
import { LeadImportExportService } from '../services/lead-import-export.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('leads')
export class LeadImportExportController {
  constructor(private readonly leadImportExportService: LeadImportExportService) {}

  @Get('sources')
  @RequirePermissions('sales.read')
  getSources(): ApiSuccessResponse<typeof LEAD_SOURCE_CATALOG> {
    return successResponse(LEAD_SOURCE_CATALOG);
  }

  @Get('import/template')
  @RequirePermissions('sales.read')
  async downloadTemplate(
    @Query('format') format: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const resolved = format === 'xlsx' ? 'xlsx' : 'csv';

    if (resolved === 'csv') {
      const csv = this.leadImportExportService.getTemplateCsv();
      response.setHeader('Content-Type', 'text/csv; charset=utf-8');
      response.setHeader('Content-Disposition', 'attachment; filename="leads-import-template.csv"');
      response.send(csv);
      return;
    }

    const buffer = await this.leadImportExportService.getTemplateXlsx();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader('Content-Disposition', 'attachment; filename="leads-import-template.xlsx"');
    response.send(buffer);
  }

  @Post('import/preview')
  @RequirePermissions('sales.create')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() body: { mapping?: string; duplicateStrategy?: string },
  ): Promise<ApiSuccessResponse<ImportPreviewResult>> {
    if (file?.buffer === undefined || file.buffer.length === 0) {
      throw new BadRequestException('A non-empty file upload is required.');
    }

    const mapping = parseMapping(body.mapping);
    const duplicateStrategy = parseDuplicateStrategy(body.duplicateStrategy);
    const parsed = await this.leadImportExportService.parseFile(
      file.buffer,
      file.mimetype || file.originalname,
    );
    const scope = this.resolveScope(headers);
    const result = await this.leadImportExportService.preview(scope, parsed.rows, mapping, {
      duplicateStrategy,
      fileHeaders: parsed.headers,
    });

    return successResponse(result);
  }

  @Post('import/commit')
  @RequirePermissions('sales.create')
  async commitImport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: CommitLeadImportDto,
  ): Promise<ApiSuccessResponse<ImportSummary>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const result = await this.leadImportExportService.commit(scope, dto.rows, context, {
      duplicateStrategy: dto.duplicateStrategy,
    });

    return successResponse(result);
  }

  @Post('export')
  @RequirePermissions('sales.read')
  async exportLeads(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() dto: ExportLeadsDto,
    @Res() response: Response,
  ): Promise<void> {
    const scope = this.resolveScope(headers);
    const exported = await this.leadImportExportService.exportLeads(scope, {
      format: dto.format,
      mode: dto.mode,
      leadIds: dto.leadIds,
      filters: dto.filters,
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

function parseMapping(raw: string | undefined): Record<string, string> {
  if (raw === undefined || raw.trim().length === 0) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new BadRequestException('mapping must be a JSON object.');
    }

    const mapping: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') {
        mapping[key] = value;
      }
    }
    return mapping;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('mapping must be a valid JSON object string.');
  }
}

function parseDuplicateStrategy(raw: string | undefined): DuplicateStrategy {
  if (raw === undefined || raw.trim().length === 0) {
    return 'skip';
  }

  if (raw === 'skip' || raw === 'update' || raw === 'create') {
    return raw;
  }

  throw new BadRequestException('duplicateStrategy must be one of: skip, update, create.');
}
