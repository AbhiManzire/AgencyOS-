import { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateProjectMemberDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  allocationPercent?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsEnum(ProjectMemberStatus)
  status?: ProjectMemberStatus;
}
