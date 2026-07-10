import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ReportDateRangeQueryDto } from '../dto/report-date-range-query.dto';
import type { FounderReport, ReportDateRange, ReportsScope, ReportType } from '../reports.types';
import {
  REPORTS_REPOSITORY,
  type ReportsRepository,
} from '../repositories/reports.repository.interface';
import { founderReportToCsv } from '../utils/csv.util';

const REPORT_TYPES: readonly ReportType[] = [
  'revenue',
  'clients',
  'projects',
  'tasks',
  'invoices',
] as const;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(REPORTS_REPOSITORY)
    private readonly reportsRepository: ReportsRepository,
  ) {}

  async getReport(
    scope: ReportsScope,
    reportType: ReportType,
    query: ReportDateRangeQueryDto,
  ): Promise<FounderReport> {
    this.assertReportType(reportType);
    const range = this.resolveDateRange(query);
    return this.reportsRepository.getReport(scope, reportType, range);
  }

  async exportCsv(
    scope: ReportsScope,
    reportType: ReportType,
    query: ReportDateRangeQueryDto,
  ): Promise<{ filename: string; csv: string }> {
    const report = await this.getReport(scope, reportType, query);
    return {
      filename: `${report.reportType}-report-${report.from}_to_${report.to}.csv`,
      csv: founderReportToCsv(report),
    };
  }

  private assertReportType(reportType: string): asserts reportType is ReportType {
    if (!REPORT_TYPES.includes(reportType as ReportType)) {
      throw new BadRequestException(
        `Invalid report type "${reportType}". Expected one of: ${REPORT_TYPES.join(', ')}.`,
      );
    }
  }

  private resolveDateRange(query: ReportDateRangeQueryDto): ReportDateRange {
    const now = new Date();
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
