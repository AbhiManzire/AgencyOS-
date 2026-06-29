import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WorkflowActionType, WorkflowStatus, WorkflowTriggerType } from '@prisma/client';

export class CreateWorkflowTriggerDto {
  @IsEnum(WorkflowTriggerType)
  type!: WorkflowTriggerType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateWorkflowActionDto {
  @IsEnum(WorkflowActionType)
  type!: WorkflowActionType;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateWorkflowDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTriggerDto)
  triggers!: CreateWorkflowTriggerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowActionDto)
  actions!: CreateWorkflowActionDto[];
}
