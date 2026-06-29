import { IsBoolean, IsOptional } from 'class-validator';

export class StartTimeEntryDto {
  @IsOptional()
  @IsBoolean()
  billable?: boolean;
}
