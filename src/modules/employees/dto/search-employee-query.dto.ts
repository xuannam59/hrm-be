import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import BaseSearchDto from '@/common/bases/search-dto.base';
import { EEmployeeStatus } from '@/common/types/employee.type';
import { Type } from 'class-transformer';

export default class SearchEmployeeQueryDto extends BaseSearchDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({
    example: EEmployeeStatus.WORKING,
    enum: EEmployeeStatus,
  })
  @IsOptional()
  @IsEnum(EEmployeeStatus)
  status?: EEmployeeStatus;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsInt()
  position?: string;
}
