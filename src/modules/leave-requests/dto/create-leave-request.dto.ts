import { ELeaveType } from '@/common/constants/leave-request.constant';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  approverId!: number;

  @ApiProperty({
    example: '2026-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate!: Date;

  @ApiProperty({
    example: '2026-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate!: Date;

  @ApiProperty({
    example: ELeaveType.ANNUAL_LEAVE,
    enum: ELeaveType,
  })
  @IsEnum(ELeaveType)
  @IsNotEmpty()
  leaveType!: ELeaveType;

  @ApiProperty({
    example: 'I need to take a leave for personal reasons',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
