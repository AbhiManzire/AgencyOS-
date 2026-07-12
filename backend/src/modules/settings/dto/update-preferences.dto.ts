import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PreferenceCategoriesDto {
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  invoice?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  finance?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  sales?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  task?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  project?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  notification?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  email?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  security?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  system?: Record<string, unknown>;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  language?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  dateFormat?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  numberFormat?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  businessHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  businessHoursEnd?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workingDays?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  financialYearStartMonth?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenceCategoriesDto)
  preferencesJson?: PreferenceCategoriesDto;
}
