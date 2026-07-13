import { IntegrationWebhookDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateWebhookDto {
  @IsEnum(IntegrationWebhookDirection)
  direction!: IntegrationWebhookDirection;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endpointPath?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_tld: false })
  targetUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  signatureHeader?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  endpointPath?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUrl({ require_tld: false })
  targetUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  secret?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  signatureHeader?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class SendWebhookDto {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
