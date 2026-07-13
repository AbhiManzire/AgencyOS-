import { IsUUID } from 'class-validator';

export class MergeClientsDto {
  @IsUUID()
  sourceClientId!: string;

  @IsUUID()
  targetClientId!: string;
}
