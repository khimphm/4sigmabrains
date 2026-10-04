import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DecisionOptionDto {
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) pros?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) cons?: string[];
}

export class CreateDecisionDto {
  @IsOptional() @IsUUID() projectId?: string | null;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsString() @MinLength(1) @MaxLength(20000) context: string;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsArray()
  @ArrayMinSize(2, { message: 'Cần ít nhất 2 phương án' })
  @ValidateNested({ each: true })
  @Type(() => DecisionOptionDto)
  options: DecisionOptionDto[];
}

export class VoteDto {
  @IsUUID() optionId: string;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class DecideDto {
  @IsUUID() optionId: string;
  @IsString() @MinLength(1) @MaxLength(10000) rationale: string;
}
