import { DealFollowUpStatus, DealFollowUpType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateFollowUpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsEnum(DealFollowUpType)
  type!: DealFollowUpType;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  reminderAt?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  outcome?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  nextFollowUpAt?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsEnum(DealFollowUpStatus)
  status?: DealFollowUpStatus;
}
