import SearchDtoBase from '@/common/bases/search-dto.base';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsString } from 'class-validator';

class SearchDepartmentQueryDto extends SearchDtoBase {
  @ApiPropertyOptional({ example: 'HR' })
  @IsOptional()
  @IsString()
  search?: string;
}

export default SearchDepartmentQueryDto;
