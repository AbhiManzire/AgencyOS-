import { DealStage } from '@prisma/client';
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

export class UpdateDealDto {
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  contactId?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  expectedCloseDate?: Date | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsEnum(DealStage)
  stage?: DealStage;
}
