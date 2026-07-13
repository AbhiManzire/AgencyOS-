import { ArrayMinSize, IsArray, IsEnum, IsIn, IsString, IsUUID, MaxLength } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class BulkAssignOwnerDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds!: string[];

  @IsUUID()
  assignedToUserId!: string;
}

export class BulkChangeStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds!: string[];

  @IsEnum(LeadStatus)
  status!: LeadStatus;
}

export class BulkAddTagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tagNames!: string[];
}

export class BulkDeleteLeadsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds!: string[];
}

export class BulkExportLeadsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  leadIds!: string[];

  @IsIn(['csv', 'xlsx'])
  format!: 'csv' | 'xlsx';
}
