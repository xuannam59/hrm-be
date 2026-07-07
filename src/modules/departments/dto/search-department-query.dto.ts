import BaseSearchDto from '@/common/bases/search-dto.base';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsString } from 'class-validator';

class SearchDepartmentQueryDto extends BaseSearchDto {
  @ApiPropertyOptional({ example: 'HR' })
  @IsOptional()
  @IsString()
  search?: string;
}

export default SearchDepartmentQueryDto;
