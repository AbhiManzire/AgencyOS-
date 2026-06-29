import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message?: string;
}
