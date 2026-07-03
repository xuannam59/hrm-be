import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDepartmentDto {
  @ApiPropertyOptional({ example: 'HR' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'HR Department' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty()
  managerId?: number;
}
