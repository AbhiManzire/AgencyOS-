import { ProjectPriority, ProjectStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
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

const SORT_FIELDS = [
  'updatedAt',
  'name',
  'status',
  'priority',
  'targetEndDate',
  'createdAt',
] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class ListProjectsQueryDto {
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
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  archivedOnly?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsUUID()
  projectManagerUserId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}
