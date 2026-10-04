import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { UserRole, UserStatus } from './user.entity.js';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(1000) bio?: string;
  @IsOptional() @IsBoolean() emailNotifications?: boolean;
}

export class UpdateMemberDto {
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
}
