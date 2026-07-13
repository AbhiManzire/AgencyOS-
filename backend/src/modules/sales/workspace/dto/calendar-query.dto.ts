import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class WorkspaceCalendarQueryDto {
  @IsOptional()
  @IsIn(['month', 'week', 'day', 'agenda'])
  view?: 'month' | 'week' | 'day' | 'agenda';

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD.' })
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD.' })
  to?: string;
}
