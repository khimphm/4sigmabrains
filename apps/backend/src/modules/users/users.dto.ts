import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole, UserStatus } from './user.entity.js';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(1000) bio?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  skills?: string[];
  @IsOptional() @IsBoolean() webNotifications?: boolean;
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
  @IsOptional() @IsBoolean() remind24h?: boolean;
  @IsOptional() @IsBoolean() remind2h?: boolean;
}

export class UpdateMemberDto {
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @IsUUID() clientId?: string | null;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;
}

export class InviteMemberDto {
  @IsEmail({}, { message: 'Email không hợp lệ' }) email: string;
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsUUID() clientId?: string | null;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  // Thêm luôn vào các dự án này
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) projectIds?: string[];
}
