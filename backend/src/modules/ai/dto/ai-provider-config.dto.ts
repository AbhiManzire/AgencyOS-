import { AiProviderKind } from '@prisma/client';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Prisma } from '@prisma/client';

export class CreateAiProviderConfigDto {
  @IsEnum(AiProviderKind)
  kind!: AiProviderKind;

  @IsString()
  @MaxLength(128)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  baseUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  model?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  apiKeyEnvRef?: string | null;

  @IsOptional()
  @IsString()
  encryptedApiKey?: string | null;

  @IsOptional()
  @IsObject()
  config?: Prisma.InputJsonValue;
}

export class UpdateAiProviderConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  baseUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  model?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  apiKeyEnvRef?: string | null;

  @IsOptional()
  @IsString()
  encryptedApiKey?: string | null;

  @IsOptional()
  @IsObject()
  config?: Prisma.InputJsonValue;
}
