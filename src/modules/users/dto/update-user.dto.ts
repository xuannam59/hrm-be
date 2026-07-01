import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  displayName?: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  roleId?: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  employeeId?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  unlinkEmployee?: boolean;
}

export default UpdateUserDto;
