import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  entityType!: string;

  @IsUUID()
  entityId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  type!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
