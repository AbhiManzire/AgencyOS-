import { IsDateString, IsOptional } from 'class-validator';

export class ReportDateRangeQueryDto {
  /** Inclusive range start (YYYY-MM-DD). Defaults to first day of current UTC month. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive range end (YYYY-MM-DD). Defaults to current UTC date. */
  @IsOptional()
  @IsDateString()
  to?: string;
}
