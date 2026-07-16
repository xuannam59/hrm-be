import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  oldPassword!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;

  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword!: string;
}
