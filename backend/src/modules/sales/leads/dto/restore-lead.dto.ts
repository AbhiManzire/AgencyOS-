import { LeadStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

const RESTORABLE_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'DISQUALIFIED',
] as const satisfies readonly LeadStatus[];

export class RestoreLeadDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  @IsIn(RESTORABLE_STATUSES)
  targetStatus?: LeadStatus;
}
