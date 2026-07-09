import { EBenefitType, EBenefitValueType } from '@/common/types/benefit.type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateEmployeeBenefitDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  employeeId: number;

  @ApiProperty({ example: EBenefitType.ANNUAL_LEAVE, enum: EBenefitType })
  @IsEnum(EBenefitType)
  @IsNotEmpty()
  benefitType: EBenefitType;

  @ApiProperty({ example: 'Annual Leave' })
  @IsString()
  @IsNotEmpty()
  benefitName: string;

  @ApiProperty({ example: '2026-07-01' })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  effectiveFrom: Date;

  @ApiProperty({ example: '2027-12-31' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  effectiveTo?: Date;

  @ApiProperty({ example: EBenefitValueType.AMOUNT, enum: EBenefitValueType })
  @IsEnum(EBenefitValueType)
  @IsNotEmpty()
  valueType: EBenefitValueType;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  value: number;
}
