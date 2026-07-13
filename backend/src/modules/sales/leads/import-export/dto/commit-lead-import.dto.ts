import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { ImportCommitAction } from '../lead-import-export.types';

class ImportCommitRowDto {
  @IsOptional()
  @Type(() => Number)
  rowNumber?: number;

  @IsObject()
  data!: Record<string, string | undefined>;

  @IsIn(['create', 'update', 'skip'])
  action!: ImportCommitAction;

  @IsOptional()
  @IsUUID()
  existingLeadId?: string;
}

export class CommitLeadImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportCommitRowDto)
  rows!: ImportCommitRowDto[];

  @IsOptional()
  @IsIn(['skip', 'update', 'create'])
  duplicateStrategy?: 'skip' | 'update' | 'create';
}
