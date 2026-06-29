import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  entityType!: string;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentCommentId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
