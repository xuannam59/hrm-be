import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserStatus } from '@/common/types/user.type';
import { Role } from '@/common/constants/role.constant';

class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  displayName?: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export default UpdateUserDto;
