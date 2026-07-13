import { LeadPriority, LeadSource, LeadStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const SORT_FIELDS = ['updatedAt', 'createdAt', 'company', 'leadScore', 'priority'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

class ExportLeadsFiltersDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsEnum(LeadSource)
  source?: LeadSource;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsEnum(LeadPriority)
  priority?: LeadPriority;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archivedOnly?: boolean;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}

export class ExportLeadsDto {
  @IsIn(['csv', 'xlsx'])
  format!: 'csv' | 'xlsx';

  @IsIn(['filter', 'selected', 'all'])
  mode!: 'filter' | 'selected' | 'all';

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ExportLeadsFiltersDto)
  filters?: ExportLeadsFiltersDto;
}
