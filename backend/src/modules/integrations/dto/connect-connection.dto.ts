import { IsObject } from 'class-validator';

export class ConnectConnectionDto {
  @IsObject()
  credentials!: Record<string, string>;
}
