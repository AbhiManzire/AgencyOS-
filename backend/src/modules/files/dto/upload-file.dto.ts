import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  entityType!: string;

  @IsUUID()
  entityId!: string;
}
