import { IsUUID } from 'class-validator';

export class ConvertFromDealDto {
  @IsUUID()
  dealId!: string;
}
