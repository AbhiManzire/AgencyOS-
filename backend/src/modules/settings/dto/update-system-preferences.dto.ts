import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSystemPreferencesDto {
  @IsOptional()
  @IsObject()
  featureFlags?: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(100 * 1024 * 1024)
  maxUploadBytes?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(32, { each: true })
  allowedFileTypes?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(256)
  emailFrom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;
}
