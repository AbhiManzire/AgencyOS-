import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
const EXPORT_FORMATS = ['CSV', 'PDF', 'XLSX'] as const;

export class CreateScheduledReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  reportType!: string;

  @IsIn(FREQUENCIES)
  frequency!: (typeof FREQUENCIES)[number];

  @IsOptional()
  @IsIn(EXPORT_FORMATS)
  exportFormat?: (typeof EXPORT_FORMATS)[number];

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipientEmails!: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
