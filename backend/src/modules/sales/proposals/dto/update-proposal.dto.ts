import { ProposalStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { ProposalSections } from '../domain/proposal-sections';

export class UpdateProposalDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  quoteId?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;

  @IsOptional()
  @IsObject()
  sections?: Partial<ProposalSections>;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  incrementVersion?: boolean;
}
