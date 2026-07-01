import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import SearchDtoBase from '@/common/bases/search-dto.base';
import { EmployeeStatus } from 'generated/prisma/client';
import { Type } from 'class-transformer';

export default class SearchEmployeeQueryDto extends SearchDtoBase {
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
    example: EmployeeStatus.WORKING,
    enum: EmployeeStatus,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsInt()
  position?: string;
}
