import { EEmployeeStatus } from '@/common/constants/employee.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class UpdateEmployeeDto {
  @ApiProperty({ example: '2026-01-01' })
  @Transform(({ value }) => new Date(value))
  @IsDate()
  @IsOptional()
  hireDate?: Date;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  position?: string;

  @ApiProperty({ enum: EEmployeeStatus, example: EEmployeeStatus.WORKING })
  @IsEnum(EEmployeeStatus)
  @IsOptional()
  status?: EEmployeeStatus;

  @ApiProperty({ example: '1' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  departmentId?: number;

  @ApiProperty({ example: 10000000.0 })
  @IsNumber()
  @IsOptional()
  basicSalary?: number;
}

export default UpdateEmployeeDto;
