import { Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';

export class GetDealForecastQueryDto {
  @IsIn(['week', 'month', 'quarter', 'year'])
  period!: 'week' | 'month' | 'quarter' | 'year';

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  asOf?: Date;
}
