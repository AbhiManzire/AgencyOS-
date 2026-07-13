import { ClientSource, ClientStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const CREATABLE_STATUSES = ['PROSPECT'] as const;

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsIn(CREATABLE_STATUSES)
  status?: (typeof CREATABLE_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  clientCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  website?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{7,15}$/, { message: 'Phone must contain 7 to 15 digits only.' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i, {
    message: 'GSTIN must be a valid 15-character Indian GSTIN.',
  })
  gstin?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/i, { message: 'PAN must be a valid 10-character PAN.' })
  pan?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/i, { message: 'Currency must be a 3-letter ISO code.' })
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateRegion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingAddressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  shippingAddressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingStateRegion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  shippingPostalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  shippingCountryCode?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalReferenceId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  becameClientAt?: Date;
}

// Re-export for callers that expect ClientStatus on create payloads.
export type CreateClientStatus = Extract<ClientStatus, 'PROSPECT'>;
