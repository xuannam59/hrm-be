import BaseSearchDto from '@/common/bases/search-dto.base';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchEmployeeEducationQueryDto extends BaseSearchDto {
  @IsOptional()
  @IsNumber()
  employeeId?: number;

  @IsOptional()
  @IsString()
  school?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsNumber()
  startYear?: number;

  @IsOptional()
  @IsNumber()
  endYear?: number;
}
