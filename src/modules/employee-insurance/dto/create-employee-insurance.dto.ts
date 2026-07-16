import { EInsuranceType } from '@/common/constants/insurance.contant';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateEmployeeInsuranceDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  @IsPositive()
  employeeId!: number;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  insuranceNumber!: string;

  @ApiProperty({ example: EInsuranceType.HEALTH, enum: EInsuranceType })
  @IsEnum(EInsuranceType)
  @IsNotEmpty()
  insuranceType!: EInsuranceType;

  @ApiProperty({ example: new Date() })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ example: new Date() })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
