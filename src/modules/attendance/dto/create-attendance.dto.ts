import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsDateString, IsInt, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAttendanceDto {
  @ApiProperty({ example: '2026-01-01' })
  @IsDate()
  @IsNotEmpty()
  @IsDateString()
  checkTime: Date;

  @ApiProperty({ example: '2026-01-01' })
  @IsDate()
  @IsNotEmpty()
  @IsDateString()
  workDate: Date;

  @ApiProperty({ example: '1' })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsNotEmpty()
  employeeId: number;
}
