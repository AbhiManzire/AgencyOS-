import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TtlCache } from '../../../common/cache/ttl-cache';
import type { ReportQueryDto } from '../dto/report-date-range-query.dto';
import type {
  AnalyticsDomain,
  AnalyticsResult,
  ExportFormat,
  ExportResult,
  FounderReport,
  ReportDateRange,
  ReportQuery,
  ReportsScope,
  ReportType,
} from '../reports.types';
import {
  ANALYTICS_REPOSITORY,
  REPORTS_REPOSITORY,
  type AnalyticsRepository,
  type ReportsRepository,
} from '../repositories/reports.repository.interface';
import { founderReportToCsv } from '../utils/csv.util';
import { founderReportToPdf } from '../utils/pdf.util';
import { founderReportToXlsx } from '../utils/xlsx.util';

const REPORT_TYPES: readonly ReportType[] = [
  'revenue',
  'clients',
  'projects',
  'tasks',
  'invoices',
  'sales_pipeline',
  'sales_conversion',
  'sales_forecast',
  'sales_lead_source',
  'sales_performance',
  'profit_loss',
  'cash_flow',
  'receivables',
  'payables',
  'gst_summary',
  'sales_register',
  'purchase_register',
  'outstanding',
  'client_ledger',
  'vendor_ledger',
  'founder',
  'expense',
  'profit',
  'sales',
  'finance',
] as const;

const ANALYTICS_DOMAINS: readonly AnalyticsDomain[] = [
  'founder',
  'clients',
  'projects',
  'tasks',
  'sales',
  'finance',
] as const;

const ANALYTICS_CACHE_TTL_MS = 60_000;

@Injectable()
export class ReportsService {
  private readonly analyticsCache = new TtlCache<AnalyticsResult>(ANALYTICS_CACHE_TTL_MS);

  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepository,
    @Inject(ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: AnalyticsRepository,
  ) {}

  async getReport(
    scope: ReportsScope,
    reportType: string,
    query: ReportQueryDto,
  ): Promise<FounderReport> {
    const normalized = this.normalizeReportType(reportType);
    const resolved = this.resolveReportQuery(query);
    return this.reportsRepository.getReport(scope, normalized, resolved);
  }

  async getAnalytics(
    scope: ReportsScope,
    domain: AnalyticsDomain,
    query: ReportQueryDto,
  ): Promise<AnalyticsResult> {
    this.assertAnalyticsDomain(domain);
    const resolved = this.resolveReportQuery(query);
    const cacheKey = [
      scope.tenantId,
      scope.workspaceId,
      domain,
      JSON.stringify({
        from: resolved.from.toISOString(),
        to: resolved.to.toISOString(),
        clientId: resolved.clientId ?? null,
        projectId: resolved.projectId ?? null,
        departmentId: resolved.departmentId ?? null,
        ownerUserId: resolved.ownerUserId ?? null,
        currency: resolved.currency ?? null,
        period: resolved.period ?? null,
      }),
    ].join('|');

    const cached = this.analyticsCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const result = await this.analyticsRepository.getAnalytics(scope, domain, resolved);
    this.analyticsCache.set(cacheKey, result);
    return result;
  }

  async exportReport(
    scope: ReportsScope,
    reportType: string,
    query: ReportQueryDto,
  ): Promise<ExportResult> {
    const format: ExportFormat = query.format ?? 'csv';
    const report = await this.getReport(scope, reportType, query);
    const baseName = `${report.reportType}-report-${report.from}_to_${report.to}`;

    if (format === 'pdf') {
      const buffer = await founderReportToPdf(report);
      return {
        filename: `${baseName}.pdf`,
        buffer,
        contentType: 'application/pdf',
      };
    }

    if (format === 'xlsx') {
      const buffer = await founderReportToXlsx(report);
      return {
        filename: `${baseName}.xlsx`,
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }

    const csv = founderReportToCsv(report);
    return {
      filename: `${baseName}.csv`,
      buffer: Buffer.from(csv, 'utf8'),
      contentType: 'text/csv; charset=utf-8',
    };
  }

  /** @deprecated Prefer exportReport */
  async exportCsv(
    scope: ReportsScope,
    reportType: ReportType,
    query: ReportQueryDto,
  ): Promise<{ filename: string; csv: string }> {
    const csvQuery: ReportQueryDto = {
      from: query.from,
      to: query.to,
      period: query.period,
      clientId: query.clientId,
      projectId: query.projectId,
      departmentId: query.departmentId,
      ownerUserId: query.ownerUserId,
      currency: query.currency,
      format: 'csv',
    };
    const result = await this.exportReport(scope, reportType, csvQuery);
    return {
      filename: result.filename,
      csv: result.buffer.toString('utf8'),
    };
  }

  normalizeReportType(reportType: string): ReportType {
    const normalized = reportType.replaceAll('-', '_') as ReportType;
    this.assertReportType(normalized);
    return normalized;
  }

  assertReportType(reportType: string): asserts reportType is ReportType {
    const normalized = reportType.replaceAll('-', '_');
    if (!REPORT_TYPES.includes(normalized as ReportType)) {
      throw new BadRequestException(
        `Invalid report type "${reportType}". Expected one of: ${REPORT_TYPES.join(', ')}.`,
      );
    }
  }

  assertAnalyticsDomain(domain: string): asserts domain is AnalyticsDomain {
    if (!ANALYTICS_DOMAINS.includes(domain as AnalyticsDomain)) {
      throw new BadRequestException(
        `Invalid analytics domain "${domain}". Expected one of: ${ANALYTICS_DOMAINS.join(', ')}.`,
      );
    }
  }

  resolveReportQuery(query: ReportQueryDto): ReportQuery {
    const range = this.resolveDateRange(query);
    return {
      ...range,
      ...(query.clientId !== undefined ? { clientId: query.clientId } : {}),
      ...(query.projectId !== undefined ? { projectId: query.projectId } : {}),
      ...(query.departmentId !== undefined ? { departmentId: query.departmentId } : {}),
      ...(query.ownerUserId !== undefined ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.currency !== undefined ? { currency: query.currency } : {}),
      ...(query.period !== undefined ? { period: query.period } : {}),
    };
  }

  private resolveDateRange(query: ReportQueryDto): ReportDateRange {
    const now = new Date();
    const period = query.period ?? 'custom';

    if (period === 'month') {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { from, to };
    }

    if (period === 'quarter') {
      const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      const from = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { from, to };
    }

    if (period === 'year') {
      const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      return { from, to };
    }

    const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const defaultTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const from = query.from ? parseDateOnly(query.from, 'from') : defaultFrom;
    const to = query.to ? parseDateOnly(query.to, 'to') : defaultTo;

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('"from" must be on or before "to".');
    }

    return { from, to };
  }
}

function parseDateOnly(value: string, field: 'from' | 'to'): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new BadRequestException(`Query "${field}" must be a YYYY-MM-DD date.`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException(`Query "${field}" must be a valid calendar date.`);
  }

  return date;
}
