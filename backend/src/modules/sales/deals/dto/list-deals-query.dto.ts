import { DealPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { DealListSortField } from '../repositories/deal.repository.interface';
import { CREATE_DEAL_STAGE_INPUT, type CreateDealStageInput } from './create-deal.dto';

const SORT_FIELDS: readonly DealListSortField[] = [
  'updatedAt',
  'createdAt',
  'value',
  'probability',
  'expectedCloseDate',
  'title',
];

export class ListDealsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  take?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsIn(CREATE_DEAL_STAGE_INPUT)
  stage?: CreateDealStageInput;

  @IsOptional()
  @IsEnum(DealPriority)
  priority?: DealPriority;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probabilityMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  probabilityMax?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: DealListSortField;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
