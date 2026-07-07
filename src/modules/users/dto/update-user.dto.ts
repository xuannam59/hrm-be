import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { EUserStatus } from '@/common/types/user.type';
import { ERole } from '@/common/constants/role.constant';

class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  displayName?: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsOptional()
  @IsEnum(ERole)
  role?: ERole;

  @ApiProperty({ enum: EUserStatus, example: EUserStatus.ACTIVE })
  @IsEnum(EUserStatus)
  @IsOptional()
  status?: EUserStatus;
}

export default UpdateUserDto;
