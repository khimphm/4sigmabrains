import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { DecisionStatus } from './decision.entity.js';
import { OpinionKind } from './decision-opinion.entity.js';

export class CreateDecisionDto {
  @IsOptional() @IsUUID() projectId?: string | null;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(20000) context: string;
  @IsOptional() @IsDateString() dueDate?: string | null;
}

export class UpdateDecisionDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) context?: string;
  @IsOptional() @IsDateString() dueDate?: string | null;
}

export class DecisionQueryDto {
  @IsOptional() @IsEnum(DecisionStatus) status?: DecisionStatus;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsString() @MaxLength(200) q?: string;
}

export class OpinionDto {
  @IsOptional() @IsEnum(OpinionKind) kind?: OpinionKind;
  @IsString() @MinLength(1) @MaxLength(10000) body: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) mentionIds?: string[];
}

export class DecideDto {
  @IsString() @MinLength(1) @MaxLength(10000) conclusion: string;
}
