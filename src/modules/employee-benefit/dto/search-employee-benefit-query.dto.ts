import BaseSearchDto from '@/common/bases/search-dto.base';
import { EBenefitType } from '@/common/types/benefit.type';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsDate, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class SearchEmployeeBenefitQueryDto extends BaseSearchDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  employeeId?: number;

  @ApiPropertyOptional({
    example: EBenefitType.ANNUAL_LEAVE,
    enum: EBenefitType,
  })
  @IsEnum(EBenefitType)
  @IsOptional()
  benefitType?: EBenefitType;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  effectiveFrom?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  effectiveTo?: Date;
}
