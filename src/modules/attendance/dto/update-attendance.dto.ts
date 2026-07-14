import {
  EAttendanceStatus,
  TIME_FORMAT,
} from '@/common/constants/attendance.constant';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: '08:30:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, {
    message: 'checkIn must be in the format HH:MM:SS',
  })
  checkIn?: string;

  @ApiPropertyOptional({ example: '17:30:00' })
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, {
    message: 'checkOut must be in the format HH:MM:SS',
  })
  checkOut?: string;

  @ApiPropertyOptional({
    example: EAttendanceStatus.PRESENT,
    enum: EAttendanceStatus,
  })
  @IsOptional()
  @IsEnum(EAttendanceStatus)
  status?: EAttendanceStatus;
}
