import { ApprovalStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateExpenseDto {
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  category!: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  employeeUserId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @Type(() => Date)
  @IsDate()
  expenseDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @IsOptional()
  @IsUUID()
  attachmentFileId?: string;
}
