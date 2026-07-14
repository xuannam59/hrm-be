import { ERole } from '@/common/constants/user.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

class ProvisionAccountDto {
  @ApiProperty({ example: 'test123@yopmail.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: ERole.EMPLOYEE, enum: ERole })
  @IsEnum(ERole)
  @IsNotEmpty()
  role: ERole;
}

export default ProvisionAccountDto;
