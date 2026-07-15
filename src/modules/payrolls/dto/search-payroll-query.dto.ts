import BaseSearchDto from '@/common/bases/search-dto.base';
import { EPayrollStatus } from '@/common/constants/payroll.constant';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';

export class SearchPayrollQueryDto extends BaseSearchDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  monthYear?: Date;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  basicSalary?: number;

  @ApiPropertyOptional({ enum: EPayrollStatus })
  @IsOptional()
  @IsEnum(EPayrollStatus)
  status?: EPayrollStatus;
}
