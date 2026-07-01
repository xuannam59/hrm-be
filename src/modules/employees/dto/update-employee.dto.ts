import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { GenderType } from '@/common/types/employee.type';

class UpdateEmployeeDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  lastName: string;

  @ApiProperty({ example: 'Male' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(GenderType)
  gender?: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDate()
  @IsOptional()
  birthday?: Date;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Tiên Du, Bắc Ninh' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  address?: string;
}

export default UpdateEmployeeDto;
