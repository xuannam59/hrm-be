import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateEmployeeHistoryDto {
  @ApiProperty({ example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiProperty({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: '2026-01-01' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiProperty({ example: '2026-01-01' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
