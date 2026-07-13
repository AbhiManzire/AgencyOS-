import { IsUUID } from 'class-validator';

export class ReassignSalesTaskDto {
  @IsUUID()
  ownerUserId!: string;
}
