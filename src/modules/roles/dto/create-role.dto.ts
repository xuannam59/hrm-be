import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @Transform(({ value }) => value.trim().toUpperCase())
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsOptional()
  description?: string;
}

export default CreateRoleDto;
