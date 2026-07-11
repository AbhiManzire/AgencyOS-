import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { ReportDateRangeQueryDto } from '../dto/report-date-range-query.dto';
import type { FounderReport, ReportsScope, ReportType } from '../reports.types';
import { ReportsService } from '../services/reports.service';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  @RequirePermissions('reports.read')
  async getRevenueReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('revenue', headers, query);
  }

  @Get('clients')
  @RequirePermissions('reports.read')
  async getClientsReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('clients', headers, query);
  }

  @Get('projects')
  @RequirePermissions('reports.read')
  async getProjectsReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('projects', headers, query);
  }

  @Get('tasks')
  @RequirePermissions('reports.read')
  async getTasksReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('tasks', headers, query);
  }

  @Get('invoices')
  @RequirePermissions('reports.read')
  async getInvoicesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('invoices', headers, query);
  }

  @Get('sales-pipeline')
  @RequirePermissions('reports.read')
  async getSalesPipelineReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_pipeline', headers, query);
  }

  @Get('sales-conversion')
  @RequirePermissions('reports.read')
  async getSalesConversionReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_conversion', headers, query);
  }

  @Get('sales-forecast')
  @RequirePermissions('reports.read')
  async getSalesForecastReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_forecast', headers, query);
  }

  @Get('sales-lead-source')
  @RequirePermissions('reports.read')
  async getSalesLeadSourceReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_lead_source', headers, query);
  }

  @Get('sales-performance')
  @RequirePermissions('reports.read')
  async getSalesPerformanceReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_performance', headers, query);
  }

  @Get('profit-loss')
  @RequirePermissions('reports.read')
  async getProfitLossReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('profit_loss', headers, query);
  }

  @Get('cash-flow')
  @RequirePermissions('reports.read')
  async getCashFlowReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('cash_flow', headers, query);
  }

  @Get('receivables')
  @RequirePermissions('reports.read')
  async getReceivablesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('receivables', headers, query);
  }

  @Get('payables')
  @RequirePermissions('reports.read')
  async getPayablesReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('payables', headers, query);
  }

  @Get('gst-summary')
  @RequirePermissions('reports.read')
  async getGstSummaryReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('gst_summary', headers, query);
  }

  @Get('sales-register')
  @RequirePermissions('reports.read')
  async getSalesRegisterReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('sales_register', headers, query);
  }

  @Get('purchase-register')
  @RequirePermissions('reports.read')
  async getPurchaseRegisterReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('purchase_register', headers, query);
  }

  @Get('outstanding')
  @RequirePermissions('reports.read')
  async getOutstandingReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('outstanding', headers, query);
  }

  @Get('client-ledger')
  @RequirePermissions('reports.read')
  async getClientLedgerReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('client_ledger', headers, query);
  }

  @Get('vendor-ledger')
  @RequirePermissions('reports.read')
  async getVendorLedgerReport(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<ApiSuccessResponse<FounderReport>> {
    return this.getTypedReport('vendor_ledger', headers, query);
  }

  @Get(':reportType/export')
  @RequirePermissions('reports.read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportReport(
    @Param('reportType') reportType: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query() query: ReportDateRangeQueryDto,
  ): Promise<StreamableFile> {
    const scope = this.resolveScope(headers);
    const { filename, csv } = await this.reportsService.exportCsv(
      scope,
      reportType as ReportType,
      query,
    );

    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  private async getTypedReport(
    reportType: ReportType,
    headers: Record<string, string | string[] | undefined>,
    query: ReportDateRangeQueryDto,
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
