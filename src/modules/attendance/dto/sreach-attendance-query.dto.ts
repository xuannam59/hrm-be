import BaseSearchDto from '@/common/bases/search-dto.base';
import { EAttendanceStatus } from '@/common/types/attendance.type';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SearchAttendanceQueryDto extends BaseSearchDto {
  @ApiPropertyOptional({ example: '2026-01-01', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ example: '2026-01-01', type: Date })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({
    example: EAttendanceStatus.PRESENT,
    enum: EAttendanceStatus,
  })
  @IsOptional()
  @IsEnum(EAttendanceStatus)
  status?: EAttendanceStatus;

  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;
}

export class SearchMyAttendanceQueryDto {
  @ApiPropertyOptional({ example: 2026, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiPropertyOptional({ example: 1, type: Number })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ example: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  day?: number;
}
