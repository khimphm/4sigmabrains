import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class CompanyDto {
  @IsString() @MaxLength(120) name: string;
  @IsString() @MaxLength(20) shortName: string;
  @IsString() @MaxLength(300) address: string;
  @IsString() @MaxLength(40) phone: string;
  @IsString() @MaxLength(120) email: string;
  @IsString() @MaxLength(200) website: string;
}

class LabelDto {
  @IsString() @MaxLength(40) name: string;
  @IsHexColor() color: string;
}

class WorkHoursDto {
  @Matches(/^\d{2}:\d{2}$/) start: string;
  @Matches(/^\d{2}:\d{2}$/) end: string;
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workDays: number[];
}

export class UpdateSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyDto)
  company?: CompanyDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => LabelDto)
  taskLabels?: LabelDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkHoursDto)
  workHours?: WorkHoursDto;
}
