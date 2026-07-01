import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  displayName: string;

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

  @ApiProperty({ example: '1' })
  @IsInt()
  @IsNotEmpty()
  roleId: number;

  @ApiProperty({ example: '1' })
  @IsInt()
  @IsOptional()
  employeeId: number;
}

export default CreateUserDto;
