import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateRoleDto {
  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'ADMIN' })
  @IsString()
  @IsOptional()
  description?: string;
}

export default CreateRoleDto;
