import { IsDateString, IsOptional } from 'class-validator';

export class AiUsageSummaryQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
