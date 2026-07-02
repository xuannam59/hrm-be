import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserStatus } from '@/common/enums/user-status.enum';

class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  displayName?: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  roleId?: number;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

export default UpdateUserDto;
