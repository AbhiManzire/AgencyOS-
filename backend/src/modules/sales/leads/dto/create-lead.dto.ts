import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
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

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  company!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

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

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  leadScore?: number | null;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
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
