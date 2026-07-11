import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class ConvertDealToInvoiceDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  projectId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  quoteId?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  issueDate?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  dueDate?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  notes?: string | null;
}
