import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { SalesTaskPriority, SalesTaskStatus, SalesTaskType } from '@prisma/client';
import { DUE_TIME_PATTERN } from '../domain/sales-task-domain.types';

export class UpdateSalesTaskDto {
  @IsOptional()
  @IsEnum(SalesTaskType)
  type?: SalesTaskType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dueDate must be YYYY-MM-DD.' })
  dueDate?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsString()
  @Matches(DUE_TIME_PATTERN, { message: 'dueTime must match HH:mm.' })
  dueTime?: string | null;

  @IsOptional()
  @IsEnum(SalesTaskPriority)
  priority?: SalesTaskPriority;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  leadId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  dealId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  clientId?: string | null;

  @IsOptional()
  @IsEnum(SalesTaskStatus)
  status?: SalesTaskStatus;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
