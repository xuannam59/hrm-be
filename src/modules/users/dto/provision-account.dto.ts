import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class ProvisionAccountDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12345678!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  roleId?: number;
}

export default ProvisionAccountDto;
