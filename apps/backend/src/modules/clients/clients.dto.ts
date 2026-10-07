import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientDto {
  @IsString() @MinLength(2) @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(100) contactName?: string;
  @IsOptional() @IsEmail({}, { message: 'Email không hợp lệ' }) email?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}

export class UpdateClientDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(100) contactName?: string | null;
  @IsOptional() @IsEmail({}, { message: 'Email không hợp lệ' }) email?:
    string | null;
  @IsOptional() @IsString() @MaxLength(30) phone?: string | null;
  @IsOptional() @IsString() @MaxLength(300) address?: string | null;
  @IsOptional() @IsString() @MaxLength(5000) notes?: string | null;
}
