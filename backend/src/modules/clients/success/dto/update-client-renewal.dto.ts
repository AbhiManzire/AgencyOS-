import { ClientRenewalStatus, ClientRenewalType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateClientRenewalDto {
  @IsOptional()
  @IsEnum(ClientRenewalType)
  type?: ClientRenewalType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number | null;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/i, { message: 'Currency must be a 3-letter ISO code.' })
  currency?: string | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  renewalDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  reminderDate?: Date | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoNotify?: boolean;

  @IsOptional()
  @IsEnum(ClientRenewalStatus)
  status?: ClientRenewalStatus;
}
