import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ESortOrder } from '../types/common.type';

class BaseSearchDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortField: string = 'createdAt';

  @ApiPropertyOptional({ enum: ESortOrder, example: ESortOrder.DESC })
  @IsOptional()
  @IsEnum(ESortOrder)
  sortOrder: ESortOrder = ESortOrder.DESC;
}

export default BaseSearchDto;
