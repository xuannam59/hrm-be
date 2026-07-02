import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class UpdateRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export default UpdateRoleDto;
