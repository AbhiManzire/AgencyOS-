import { ProjectMemberRole, ProjectMemberStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateProjectMemberDto {
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  allocationPercent?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Date)
  @IsDate()
  startDate?: Date | null;

  @IsOptional()
  @IsEnum(ProjectMemberStatus)
  status?: ProjectMemberStatus;
}
