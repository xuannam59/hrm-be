import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

class UpdateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  displayName: string;

  @ApiProperty({ example: '1' })
  @IsInt()
  @IsOptional()
  roleId: number;

  @ApiProperty({ example: '1' })
  @IsInt()
  @IsOptional()
  employeeId: number;
}

export default UpdateUserDto;
