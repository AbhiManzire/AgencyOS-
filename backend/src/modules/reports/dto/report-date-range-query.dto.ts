import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import type { ExportFormat, ReportPeriod } from '../reports.types';

/** Query DTO for report/analytics/export endpoints (date range + optional filters). */
export class ReportQueryDto {
  /** Inclusive range start (YYYY-MM-DD). Defaults based on period or first day of current UTC month. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive range end (YYYY-MM-DD). Defaults based on period or current UTC date. */
  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(['month', 'quarter', 'year', 'custom'])
  period?: ReportPeriod;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsIn(['csv', 'pdf', 'xlsx'])
  format?: ExportFormat;
}

/** @deprecated Use ReportQueryDto */
export class ReportDateRangeQueryDto extends ReportQueryDto {}
