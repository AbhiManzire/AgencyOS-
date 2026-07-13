import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  WorkflowActionDelayType,
  WorkflowActionType,
  WorkflowConditionLogic,
  WorkflowConditionNodeType,
  WorkflowConditionOperator,
  WorkflowStatus,
  WorkflowTriggerType,
} from '@prisma/client';

export class CreateWorkflowTriggerDto {
  @IsEnum(WorkflowTriggerType)
  type!: WorkflowTriggerType;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxRetries?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  retryDelayMs?: number;

  @IsOptional()
  @IsEnum(WorkflowActionDelayType)
  delayType?: WorkflowActionDelayType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  delayValue?: number | null;

  @IsOptional()
  @IsDateString()
  delayUntil?: string | null;
}

export class CreateWorkflowConditionDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  parentKey?: string | null;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsEnum(WorkflowConditionNodeType)
  nodeType?: WorkflowConditionNodeType;

  @IsOptional()
  @IsEnum(WorkflowConditionLogic)
  logic?: WorkflowConditionLogic;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  field?: string | null;

  @IsOptional()
  @IsEnum(WorkflowConditionOperator)
  operator?: WorkflowConditionOperator | null;

  @IsOptional()
  value?: unknown;

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

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTriggerDto)
  triggers!: CreateWorkflowTriggerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowActionDto)
  actions!: CreateWorkflowActionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowConditionDto)
  conditions?: CreateWorkflowConditionDto[];
}
