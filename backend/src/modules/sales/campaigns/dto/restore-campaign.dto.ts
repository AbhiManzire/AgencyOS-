import { SalesCampaignStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

const RESTORABLE_STATUSES = [
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
] as const satisfies readonly SalesCampaignStatus[];

export class RestoreCampaignDto {
  @IsOptional()
  @IsEnum(SalesCampaignStatus)
  @IsIn(RESTORABLE_STATUSES)
  targetStatus?: SalesCampaignStatus;
}
