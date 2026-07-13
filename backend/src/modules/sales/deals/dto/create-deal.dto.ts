import { DealForecastCategory, DealPriority, LeadSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/** Accepts current DealStage values plus legacy aliases mapped in DealMapper. */
export const CREATE_DEAL_STAGE_INPUT = [
  'QUALIFICATION',
  'DISCOVERY',
  'PROPOSAL',
  'NEGOTIATION',
  'VERBAL_COMMIT',
  'WON',
  'LOST',
  'ARCHIVED',
  'NEW',
  'CONTACTED',
  'QUALIFIED',
] as const;

export type CreateDealStageInput = (typeof CREATE_DEAL_STAGE_INPUT)[number];

export class CreateDealDto {
  @IsUUID()
  clientId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  contactId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  leadId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  expectedCloseDate?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsIn(CREATE_DEAL_STAGE_INPUT)
  stage?: CreateDealStageInput;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsEnum(LeadSource)
  source?: LeadSource | null;

  @IsOptional()
  @IsEnum(DealForecastCategory)
  forecastCategory?: DealForecastCategory;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  service?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number | null;

  @IsOptional()
  @IsEnum(DealPriority)
  priority?: DealPriority;
}
