import { RecurringFrequency } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateRecurringDto {
  @IsEnum(RecurringFrequency)
  frequency!: RecurringFrequency;

  @Type(() => Date)
  @IsDate()
  nextRunAt!: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsObject()
  template!: Record<string, unknown>;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderDaysBefore?: number | null;
}

export class UpdateRecurringDto {
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  nextRunAt?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  template?: Record<string, unknown>;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  reminderDaysBefore?: number | null;
}

export class ListRecurringQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean;
}
