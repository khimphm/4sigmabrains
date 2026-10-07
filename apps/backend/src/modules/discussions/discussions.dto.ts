import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDiscussionDto {
  @IsOptional() @IsUUID() projectId?: string | null;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(20000) body: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) mentionIds?: string[];
}

export class UpdateDiscussionDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20000) body?: string;
  @IsOptional() @IsBoolean() pinned?: boolean;
}

export class ReplyDto {
  @IsString() @MinLength(1) @MaxLength(10000) body: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) mentionIds?: string[];
}
