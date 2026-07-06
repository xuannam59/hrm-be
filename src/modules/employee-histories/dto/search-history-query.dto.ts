import SearchDtoBase from '@/common/bases/search-dto.base';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

class SearchHistoryQueryDto extends SearchDtoBase {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'employee', type: Number })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  employeeId?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateFrom?: Date;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateTo?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateFrom?: Date;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateTo?: Date;
}

export default SearchHistoryQueryDto;
