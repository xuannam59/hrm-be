import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GenderType } from '@/common/types/employee.type';
import ProvisionAccountDto from '@/modules/users/dto/provision-account.dto';
import { EmployeeStatus } from '@/common/types/employee.type';

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

  @ApiProperty({ example: GenderType.MALE, enum: GenderType })
  @IsEnum(GenderType)
  gender: GenderType;

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

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  position: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty({
    example: EmployeeStatus.WORKING,
    enum: EmployeeStatus,
    default: EmployeeStatus.WORKING,
  })
  @IsEnum(EmployeeStatus)
  @IsNotEmpty()
  status: EmployeeStatus;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ProvisionAccountDto)
  @IsOptional()
  account?: ProvisionAccountDto;
}

export default CreateEmployeeDto;
