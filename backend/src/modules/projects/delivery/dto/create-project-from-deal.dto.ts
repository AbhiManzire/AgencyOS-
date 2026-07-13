import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectFromDealDto {
  @IsUUID()
  dealId!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  projectManagerUserId?: string;
}
