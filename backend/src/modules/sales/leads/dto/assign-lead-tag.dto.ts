import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AssignLeadTagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  colorToken?: string | null;
}
