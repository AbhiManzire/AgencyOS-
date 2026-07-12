import { Type } from 'class-transformer';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class EnqueueExecutionDto {
  @IsUUID()
  workflowId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  triggerType?: string;

  @IsOptional()
  @IsObject()
  triggerPayload?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  maxAttempts?: number;
}
