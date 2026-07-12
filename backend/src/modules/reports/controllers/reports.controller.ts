import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { ReportQueryDto } from '../dto/report-date-range-query.dto';
import type {
  AnalyticsDomain,
  AnalyticsResult,
  FounderReport,
  ReportsScope,
  ReportType,
} from '../reports.types';
import { ReportsService } from '../services/reports.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('analytics/:domain')
  @RequirePermissions('reports.read')
  async getAnalytics(
    @Param('domain') domain: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<AnalyticsResult>> {
    const scope = this.resolveScope(headers);
    const result = await this.reportsService.getAnalytics(scope, domain as AnalyticsDomain, query);
    return successResponse(result);
  }

  @Get('founder')
  @RequirePermissions('reports.read')
  async getFounderReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('founder', headers, query);
  }

  @Get('expense')
  @RequirePermissions('reports.read')
  async getExpenseReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('expense', headers, query);
  }

  @Get('profit')
  @RequirePermissions('reports.read')
  async getProfitReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('profit', headers, query);
  }

  @Get('sales')
  @RequirePermissions('reports.read')
  async getSalesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales', headers, query);
  }

  @Get('finance')
  @RequirePermissions('reports.read')
  async getFinanceReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('finance', headers, query);
  }

  @Get('revenue')
  @RequirePermissions('reports.read')
  async getRevenueReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('revenue', headers, query);
  }

  @Get('clients')
  @RequirePermissions('reports.read')
  async getClientsReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('clients', headers, query);
  }

  @Get('projects')
  @RequirePermissions('reports.read')
  async getProjectsReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('projects', headers, query);
  }

  @Get('tasks')
  @RequirePermissions('reports.read')
  async getTasksReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('tasks', headers, query);
  }

  @Get('invoices')
  @RequirePermissions('reports.read')
  async getInvoicesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('invoices', headers, query);
  }

  @Get('sales-pipeline')
  @RequirePermissions('reports.read')
  async getSalesPipelineReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_pipeline', headers, query);
  }

  @Get('sales-conversion')
  @RequirePermissions('reports.read')
  async getSalesConversionReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_conversion', headers, query);
  }

  @Get('sales-forecast')
  @RequirePermissions('reports.read')
  async getSalesForecastReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_forecast', headers, query);
  }

  @Get('sales-lead-source')
  @RequirePermissions('reports.read')
  async getSalesLeadSourceReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_lead_source', headers, query);
  }

  @Get('sales-performance')
  @RequirePermissions('reports.read')
  async getSalesPerformanceReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_performance', headers, query);
  }

  @Get('profit-loss')
  @RequirePermissions('reports.read')
  async getProfitLossReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('profit_loss', headers, query);
  }

  @Get('cash-flow')
  @RequirePermissions('reports.read')
  async getCashFlowReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('cash_flow', headers, query);
  }

  @Get('receivables')
  @RequirePermissions('reports.read')
  async getReceivablesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('receivables', headers, query);
  }

  @Get('payables')
  @RequirePermissions('reports.read')
  async getPayablesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('payables', headers, query);
  }

  @Get('gst-summary')
  @RequirePermissions('reports.read')
  async getGstSummaryReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('gst_summary', headers, query);
  }

  @Get('sales-register')
  @RequirePermissions('reports.read')
  async getSalesRegisterReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_register', headers, query);
  }

  @Get('purchase-register')
  @RequirePermissions('reports.read')
  async getPurchaseRegisterReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('purchase_register', headers, query);
  }

  @Get('outstanding')
  @RequirePermissions('reports.read')
  async getOutstandingReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('outstanding', headers, query);
  }

  @Get('client-ledger')
  @RequirePermissions('reports.read')
  async getClientLedgerReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('client_ledger', headers, query);
  }

  @Get('vendor-ledger')
  @RequirePermissions('reports.read')
  async getVendorLedgerReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('vendor_ledger', headers, query);
  }

  @Get(':reportType/export')
  @RequirePermissions('reports.read')
  async exportReport(
    @Param('reportType') reportType: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const scope = this.resolveScope(headers);
    const result = await this.reportsService.exportReport(scope, reportType, query);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new StreamableFile(result.buffer, {
      type: result.contentType,
      disposition: `attachment; filename="${result.filename}"`,
    });
  }

  private async getTypedReport(
    reportType: ReportType,
    headers: Record<string, string | string[] | undefined>,
    query: ReportQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    const scope = this.resolveScope(headers);
    const report = await this.reportsService.getReport(scope, reportType, query);
    return successResponse(report);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): ReportsScope {
    const tenantId = this.readHeader(headers, TENANT_HEADER);
    const workspaceId = this.readHeader(headers, WORKSPACE_HEADER);

    if (!isUUID(tenantId)) {
      throw new BadRequestException(`Header "${TENANT_HEADER}" must be a valid UUID.`);
    }

    if (!isUUID(workspaceId)) {
      throw new BadRequestException(`Header "${WORKSPACE_HEADER}" must be a valid UUID.`);
    }

    return { tenantId, workspaceId };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
