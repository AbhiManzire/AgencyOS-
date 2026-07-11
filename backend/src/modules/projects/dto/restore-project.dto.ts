import { ProjectStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class RestoreProjectDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  targetStatus?: ProjectStatus;
}
