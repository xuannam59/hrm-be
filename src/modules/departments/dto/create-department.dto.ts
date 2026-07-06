import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'HR' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'HR' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsOptional()
  managerId?: number;
}
