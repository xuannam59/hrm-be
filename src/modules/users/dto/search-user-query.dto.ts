import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EUserStatus } from '@/common/types/user.type';
import SearchDtoBase from '@/common/bases/search-dto.base';
import { ERole } from '@/common/constants/role.constant';

export class SearchUserQueryDto extends SearchDtoBase {
  @ApiPropertyOptional({ example: 'john' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: ERole.EMPLOYEE, enum: ERole })
  @IsOptional()
  @IsEnum(ERole)
  role?: ERole;

  @ApiPropertyOptional({ enum: EUserStatus, example: EUserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;
}
