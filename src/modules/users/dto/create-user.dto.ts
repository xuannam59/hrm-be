import { ERole } from '@/common/constants/role.constant';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class CreateUserDto {
  @ApiProperty({ example: 'test@yopmail.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(ERole)
  role: ERole;

  @ApiProperty({ example: 'System Admin' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  displayName?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  employeeId: number;
}

export default CreateUserDto;
