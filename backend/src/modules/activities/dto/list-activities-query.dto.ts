import { ActivityOrigin, ActivityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

function parseTypes(value: unknown): ActivityType[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          return String(item).split(',');
        }
        return [];
      })
      .map((item) => item.trim())
      .filter((item) => item.length > 0) as ActivityType[];
  }

  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
    return undefined;
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0) as ActivityType[];
}

export class ListActivitiesQueryDto {
  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @IsOptional()
  @Transform(({ value }) => parseTypes(value))
  @IsEnum(ActivityType, { each: true })
  types?: ActivityType[];

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(ActivityOrigin)
  origin?: ActivityOrigin;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

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
}
