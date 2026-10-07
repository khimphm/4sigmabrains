import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ProjectRole } from './project-member.entity.js';
import { ProjectStatus } from './project.entity.js';

export class CreateProjectDto {
  @IsString() @MinLength(2) @MaxLength(120) name: string;
  @Matches(/^[A-Z][A-Z0-9]{1,9}$/, {
    message: 'Mã dự án gồm 2-10 chữ in hoa hoặc số, bắt đầu bằng chữ',
  })
  key: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) memberIds?: string[];
  @IsOptional() @IsUUID() clientId?: string | null;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsUUID() clientId?: string | null;
}

export class AddMembersDto {
  @IsArray() @ArrayNotEmpty() @IsUUID('all', { each: true }) userIds: string[];
  @IsOptional() @IsEnum(ProjectRole) role?: ProjectRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole) role: ProjectRole;
}
