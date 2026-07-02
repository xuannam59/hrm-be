import SearchDtoBase from '@/common/bases/search-dto.base';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

class SearchRoleQueryDto extends SearchDtoBase {
  @ApiPropertyOptional({ example: 'ADMIN' })
  @Transform(({ value }) => value.trim().toUpperCase())
  @IsOptional()
  @IsString()
  name?: string;
}

export default SearchRoleQueryDto;
