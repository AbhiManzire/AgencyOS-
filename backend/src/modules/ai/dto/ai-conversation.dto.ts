import { AiConversationStatus, AiMessageRole, AiProviderKind } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { Prisma } from '@prisma/client';

export class CreateAiConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  title?: string | null;

  @IsOptional()
  @IsEnum(AiProviderKind)
  providerKind?: AiProviderKind | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  model?: string | null;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;
}

export class ListAiConversationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @IsEnum(AiConversationStatus)
  status?: AiConversationStatus;
}

export class AppendAiMessageDto {
  @IsEnum(AiMessageRole)
  role!: AiMessageRole;

  @IsString()
  content!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  tokenCount?: number | null;

  @IsOptional()
  @IsObject()
  metadata?: Prisma.InputJsonValue;
}
