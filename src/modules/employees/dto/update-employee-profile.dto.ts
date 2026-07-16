import { EGenderType } from '@/common/constants/employee.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

class UpdateEmployeeProfileDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: EGenderType.MALE, enum: EGenderType })
  @IsEnum(EGenderType)
  @IsNotEmpty()
  gender!: EGenderType;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'Tien Du, Bac Ninh' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: '2026-07-01' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsNotEmpty()
  birthday!: Date;

  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export default UpdateEmployeeProfileDto;
