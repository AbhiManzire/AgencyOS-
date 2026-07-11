import { ApprovalStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
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

const SORT_FIELDS = ['updatedAt', 'createdAt', 'expenseDate', 'amount'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class ListExpensesQueryDto {
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
  @IsString()
  @MaxLength(255)
  q?: string;

  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsUUID()
  employeeUserId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeArchived?: boolean;

  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number];

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number];
}
