import { IsEmail, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class SendInvoiceEmailDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;
}
