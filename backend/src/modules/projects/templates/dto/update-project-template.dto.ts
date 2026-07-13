import { ClientDocumentFolder, ProjectServiceType, TaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateProjectTemplateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  offsetDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  tempKey?: string;
}

export class UpdateProjectTemplateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  offsetDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  checklistJson?: unknown;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  milestoneTempKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  milestoneSortOrder?: number | null;
}

export class UpdateProjectTemplateDeliverableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProjectTemplateRequiredDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsEnum(ClientDocumentFolder)
  folder?: ClientDocumentFolder | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateProjectTemplateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsEnum(ProjectServiceType)
  serviceType?: ProjectServiceType;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDurationDays?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultEstimatedHours?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProjectTemplateMilestoneDto)
  milestones?: UpdateProjectTemplateMilestoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProjectTemplateTaskDto)
  tasks?: UpdateProjectTemplateTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProjectTemplateDeliverableDto)
  deliverables?: UpdateProjectTemplateDeliverableDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProjectTemplateRequiredDocumentDto)
  requiredDocuments?: UpdateProjectTemplateRequiredDocumentDto[];
}
