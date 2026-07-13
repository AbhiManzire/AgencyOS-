import { ClientDocumentFolder } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  entityType!: string;

  @IsUUID()
  entityId!: string;

  @IsOptional()
  @IsEnum(ClientDocumentFolder)
  folder?: ClientDocumentFolder;
}
