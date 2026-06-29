import { InvoiceStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  projectId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  quoteId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

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
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  notes?: string | null;
}
