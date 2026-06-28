import { ClientStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional } from 'class-validator';

const RESTORABLE_STATUSES = ['ACTIVE', 'INACTIVE'] as const satisfies readonly ClientStatus[];

export class RestoreClientDto {
  @IsOptional()
  @IsEnum(ClientStatus)
  @IsIn(RESTORABLE_STATUSES)
  targetStatus?: ClientStatus;
}
