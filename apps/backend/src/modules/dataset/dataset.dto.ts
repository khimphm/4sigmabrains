import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { AnnotationStatus } from './dataset.entities.js';

export class LabelTypeDto {
  @IsString() @MinLength(2) @MaxLength(100) name: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsNumber() position?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateLabelTypeDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string | null;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsNumber() position?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class BatchDto {
  @IsString() @MinLength(2) @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsUUID() projectId?: string | null;
}

export class UpdateBatchDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string | null;
  @IsOptional() @IsUUID() projectId?: string | null;
}

export class UpdateDrawingDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(60) code?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string | null;
  @IsOptional() @IsUUID() labelerId?: string | null;
  @IsOptional() @IsUUID() reviewerId?: string | null;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  pageCount?: number;
}

export class AnnotationDto {
  @IsUUID() labelTypeId: string;
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsNumber() @Min(0) @Max(1) x: number;
  @IsNumber() @Min(0) @Max(1) y: number;
  @IsNumber() @Min(0.001) @Max(1) width: number;
  @IsNumber() @Min(0.001) @Max(1) height: number;
  @IsOptional() @IsString() @MaxLength(2000) note?: string;
}

export class UpdateAnnotationDto {
  @IsOptional() @IsUUID() labelTypeId?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) x?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) y?: number;
  @IsOptional() @IsNumber() @Min(0.001) @Max(1) width?: number;
  @IsOptional() @IsNumber() @Min(0.001) @Max(1) height?: number;
  @IsOptional() @IsString() @MaxLength(2000) note?: string | null;
}

export class SubmitDto {
  @IsOptional() @IsUUID() reviewerId?: string;
}

class AnnotationReviewDto {
  @IsUUID() id: string;
  @IsEnum(AnnotationStatus) status: AnnotationStatus;
  @IsOptional() @IsString() @MaxLength(2000) reviewNote?: string;
}

export class ReviewDto {
  @IsIn(['APPROVE', 'REQUEST_CHANGES']) decision: 'APPROVE' | 'REQUEST_CHANGES';
  @IsOptional() @IsString() @MaxLength(5000) note?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnotationReviewDto)
  annotations?: AnnotationReviewDto[];
}
