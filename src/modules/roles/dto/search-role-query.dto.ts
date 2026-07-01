import SearchDtoBase from '@/common/bases/search-dto.base';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

class SearchRoleQueryDto extends SearchDtoBase {
  @ApiPropertyOptional({ example: 'ADMIN' })
  @IsOptional()
  @IsString()
  name?: string;
}

export default SearchRoleQueryDto;
