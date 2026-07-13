import { FollowUpPriority, FollowUpRecurrence, FollowUpReminderType } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { FOLLOW_UP_TIME_PATTERN } from '../domain/follow-up-domain.types';

export class UpdateFollowUpDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'followUpDate must be YYYY-MM-DD.' })
  followUpDate?: string;

  @IsOptional()
  @IsString()
  @Matches(FOLLOW_UP_TIME_PATTERN, { message: 'followUpTime must match HH:mm.' })
  followUpTime?: string;

  @IsOptional()
  @IsEnum(FollowUpPriority)
  priority?: FollowUpPriority;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsEnum(FollowUpReminderType)
  reminderType?: FollowUpReminderType;

  @IsOptional()
  @IsEnum(FollowUpRecurrence)
  recurrence?: FollowUpRecurrence;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsObject()
  metadata?: Record<string, unknown> | null;
}
