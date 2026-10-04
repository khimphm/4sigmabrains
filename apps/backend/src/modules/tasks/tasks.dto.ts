import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { TaskPriority, TaskStatus } from './task.entity.js';

export class CreateTaskDto {
  @IsUUID() projectId: string;
  @IsString() @MinLength(1) @MaxLength(300) title: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsUUID() assigneeId?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) labels?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) checklist?: string[];
}

export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string | null;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(TaskPriority) priority?: TaskPriority;
  @IsOptional() @IsUUID() assigneeId?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() dueDate?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) labels?: string[];
}

export class MoveTaskDto {
  @IsEnum(TaskStatus) status: TaskStatus;
  @Type(() => Number) @IsNumber() position: number;
}

export class TaskQueryDto {
  @IsOptional() @IsUUID() projectId?: string;
  // "me" = công việc được giao cho tôi
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsDateString() dueFrom?: string;
  @IsOptional() @IsDateString() dueTo?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() includeDone?: string;
}

export class ChecklistItemDto {
  @IsString() @MinLength(1) @MaxLength(500) content: string;
}

export class UpdateChecklistItemDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(500) content?: string;
  @IsOptional() @IsBoolean() done?: boolean;
}

export class CommentDto {
  @IsString() @MinLength(1) @MaxLength(10000) body: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) mentionIds?: string[];
}
