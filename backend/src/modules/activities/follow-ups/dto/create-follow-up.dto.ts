import { FollowUpPriority, FollowUpRecurrence, FollowUpReminderType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { FOLLOW_UP_TIME_PATTERN } from '../domain/follow-up-domain.types';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  entityType!: string;

  @IsUUID()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'followUpDate must be YYYY-MM-DD.' })
  followUpDate!: string;

  @IsString()
  @Matches(FOLLOW_UP_TIME_PATTERN, { message: 'followUpTime must match HH:mm.' })
  followUpTime!: string;

  @IsOptional()
  @IsEnum(FollowUpPriority)
  priority?: FollowUpPriority;

  @IsUUID()
  assignedUserId!: string;

  @IsEnum(FollowUpReminderType)
  reminderType!: FollowUpReminderType;

  @IsOptional()
  @IsEnum(FollowUpRecurrence)
  recurrence?: FollowUpRecurrence;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
