import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const CREATABLE_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED'] as const;

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  company!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactPerson!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,15}$/, { message: 'Phone must contain 7 to 15 digits only.' })
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsEnum(LeadSource)
  source!: LeadSource;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  campaignId?: string | null;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsIn(CREATABLE_STATUSES)
  status?: (typeof CREATABLE_STATUSES)[number];

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  expectedDealSize?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  need?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  authority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  budgetNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  timeline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  painPoints?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  decisionMaker?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  competitor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  qualificationNotes?: string;
}

export type CreateLeadStatus = Extract<LeadStatus, 'NEW' | 'CONTACTED' | 'QUALIFIED'>;
