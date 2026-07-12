import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AiProviderKind } from '@prisma/client';

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(AiProviderKind)
  defaultProviderKind?: AiProviderKind | null;

  @IsOptional()
  defaultModel?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(128_000)
  maxTokensPerRequest?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  monthlyTokenBudget?: number | null;

  @IsOptional()
  @IsBoolean()
  auditPrompts?: boolean;
}
