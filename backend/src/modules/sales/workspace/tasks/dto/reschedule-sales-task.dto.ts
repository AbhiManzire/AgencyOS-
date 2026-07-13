import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { DUE_TIME_PATTERN } from '../domain/sales-task-domain.types';

export class RescheduleSalesTaskDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be YYYY-MM-DD.' })
  dueDate!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @Matches(DUE_TIME_PATTERN, { message: 'dueTime must match HH:mm.' })
  dueTime?: string | null;
}
