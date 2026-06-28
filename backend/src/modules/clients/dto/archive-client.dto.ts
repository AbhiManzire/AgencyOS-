import { IsBoolean, IsOptional } from 'class-validator';

/** Transport payload for archive confirmation (no business rules). */
export class ArchiveClientDto {
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;
}
