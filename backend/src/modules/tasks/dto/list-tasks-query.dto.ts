import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
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
  'dueDate',
  'priority',
  'status',
  'title',
  'boardOrder',
  'createdAt',
] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class ListTasksQueryDto {
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
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsUUID()
  reporterUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueTo?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  boardOrderFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  boardOrderTo?: number;

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
