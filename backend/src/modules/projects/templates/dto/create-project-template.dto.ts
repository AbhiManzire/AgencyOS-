import { ClientDocumentFolder, ProjectServiceType, TaskPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
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

export class CreateProjectTemplateMilestoneDto {
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

export class CreateProjectTemplateTaskDto {
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

export class CreateProjectTemplateDeliverableDto {
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

export class CreateProjectTemplateRequiredDocumentDto {
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

export class CreateProjectTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsEnum(ProjectServiceType)
  serviceType!: ProjectServiceType;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDurationDays?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultEstimatedHours?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTemplateMilestoneDto)
  milestones?: CreateProjectTemplateMilestoneDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTemplateTaskDto)
  tasks?: CreateProjectTemplateTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTemplateDeliverableDto)
  deliverables?: CreateProjectTemplateDeliverableDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectTemplateRequiredDocumentDto)
  requiredDocuments?: CreateProjectTemplateRequiredDocumentDto[];
}
