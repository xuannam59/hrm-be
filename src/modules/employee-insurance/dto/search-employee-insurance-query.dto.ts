import BaseSearchDto from '@/common/bases/search-dto.base';
import { EInsuranceType } from '@/common/constants/insurance.contant';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class SearchEmployeeInsuranceQueryDto extends BaseSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  employeeId?: number;

  @ApiPropertyOptional({ example: EInsuranceType.HEALTH, enum: EInsuranceType })
  @IsOptional()
  @IsEnum(EInsuranceType)
  insuranceType?: EInsuranceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDate()
  startDateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startDateTo?: Date;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDate()
  endDateFrom?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endDateTo?: Date;
}
