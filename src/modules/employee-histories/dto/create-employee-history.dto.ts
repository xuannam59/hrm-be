import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeHistoryDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsNotEmpty()
  employeeId!: number;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsNotEmpty()
  departmentId!: number;

  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @ApiProperty({ example: '2026-01-01' })
  @IsDate()
  @IsNotEmpty()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({ example: 10000000.0 })
  @IsNumber()
  @IsNotEmpty()
  basicSalary!: number;
}
