import { ReminderRecurrence } from '@prisma/client';
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
import { REMIND_TIME_PATTERN } from '../domain/reminder-domain.types';

export class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'remindDate must be YYYY-MM-DD.' })
  remindDate!: string;

  @IsString()
  @Matches(REMIND_TIME_PATTERN, { message: 'remindTime must match HH:mm.' })
  remindTime!: string;

  @IsOptional()
  @IsEnum(ReminderRecurrence)
  recurrence?: ReminderRecurrence;

  @IsUUID()
  assignedUserId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  notificationEventKey!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(128)
  entityType?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  entityId?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
