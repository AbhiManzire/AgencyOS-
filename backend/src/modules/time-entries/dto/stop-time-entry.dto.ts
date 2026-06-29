import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class StopTimeEntryDto {
  @IsOptional()
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
