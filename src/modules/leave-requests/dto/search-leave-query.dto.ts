import BaseSearchDto from '@/common/bases/search-dto.base';
import {
  ELeaveRequestStatus,
  ELeaveType,
} from '@/common/constants/leave-request.constant';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';

export class SearchLeaveQueryDto extends BaseSearchDto {
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

  @ApiPropertyOptional({ example: ELeaveType.OTHER, enum: ELeaveType })
  @IsOptional()
  @IsEnum(ELeaveType)
  leaveType?: ELeaveType;

  @ApiPropertyOptional({
    example: ELeaveRequestStatus.PENDING,
    enum: ELeaveRequestStatus,
    default: ELeaveRequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ELeaveRequestStatus)
  status?: ELeaveRequestStatus;
}

export class SearchMyLeaveQueryDto extends BaseSearchDto {
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

  @ApiPropertyOptional({ example: ELeaveType.OTHER, enum: ELeaveType })
  @IsOptional()
  @IsEnum(ELeaveType)
  leaveType?: ELeaveType;

  @ApiPropertyOptional({
    example: ELeaveRequestStatus.PENDING,
    enum: ELeaveRequestStatus,
    default: ELeaveRequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ELeaveRequestStatus)
  status?: ELeaveRequestStatus;
}
