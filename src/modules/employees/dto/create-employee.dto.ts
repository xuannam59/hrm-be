import {
  EEmployeeStatus,
  EGenderType,
} from '@/common/constants/employee.constant';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class CreateEmployeeDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: EGenderType.MALE, enum: EGenderType })
  @IsEnum(EGenderType)
  gender: EGenderType;

  @ApiProperty({ example: '1990-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  birthday?: Date;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Tien Du, Bac Ninh' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  address?: string;

  @ApiProperty({ example: '2026-07-01' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  hireDate: Date;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty({
    example: EEmployeeStatus.WORKING,
    enum: EEmployeeStatus,
    default: EEmployeeStatus.WORKING,
  })
  @IsEnum(EEmployeeStatus)
  @IsNotEmpty()
  status: EEmployeeStatus;

  @ApiProperty({ example: 10000000.0 })
  @IsNumber()
  @IsNotEmpty()
  basicSalary: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ProvisionAccountDto)
  @IsOptional()
  account?: ProvisionAccountDto;
}

export default CreateEmployeeDto;
