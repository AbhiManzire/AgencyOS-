import { IntegrationProviderKey } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateConnectionDto {
  @IsEnum(IntegrationProviderKey)
  providerKey!: IntegrationProviderKey;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isEnabled?: boolean;
}
