import { ReminderRecurrence, ReminderStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
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

const UPDATABLE_STATUSES = ['PENDING', 'SENT', 'COMPLETED'] as const;

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  body?: string | null;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'remindDate must be YYYY-MM-DD.' })
  remindDate?: string;

  @IsOptional()
  @Matches(REMIND_TIME_PATTERN, { message: 'remindTime must match HH:mm.' })
  remindTime?: string;

  @IsOptional()
  @IsEnum(ReminderRecurrence)
  recurrence?: ReminderRecurrence;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  notificationEventKey?: string;

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
  @IsIn(UPDATABLE_STATUSES)
  status?: (typeof UPDATABLE_STATUSES)[number];

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  metadata?: Record<string, unknown> | null;
}

export type UpdateReminderStatus = Extract<ReminderStatus, 'PENDING' | 'SENT' | 'COMPLETED'>;
