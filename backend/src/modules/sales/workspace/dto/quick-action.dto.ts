import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DUE_TIME_PATTERN } from '../tasks/domain/sales-task-domain.types';
import type { QuickActionType } from '../services/workspace-application.types';

const QUICK_ACTIONS: readonly QuickActionType[] = [
  'complete_task',
  'reschedule_task',
  'reassign_task',
  'add_note',
  'log_call',
  'start_meeting',
  'send_email',
  'send_whatsapp',
  'convert_lead',
  'open_deal',
];

export class QuickActionDto {
  @IsIn(QUICK_ACTIONS)
  action!: QuickActionType;

  @IsOptional()
  @IsUUID()
  taskId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

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
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
