import { IsEmail, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
