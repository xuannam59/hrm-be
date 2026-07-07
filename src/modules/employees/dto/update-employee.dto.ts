import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { EEmployeeStatus } from '@/common/types/employee.type';
import { Transform, Type } from 'class-transformer';

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
}

export default UpdateEmployeeDto;
