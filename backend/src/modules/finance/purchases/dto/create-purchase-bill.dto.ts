import { PurchaseBillStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseBillDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  billNumber!: string;

  @IsOptional()
  @IsEnum(PurchaseBillStatus)
  status?: PurchaseBillStatus;

  @Type(() => Date)
  @IsDate()
  issueDate!: Date;

  @Type(() => Date)
  @IsDate()
  dueDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
