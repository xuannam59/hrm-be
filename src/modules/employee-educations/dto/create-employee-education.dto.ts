import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEmployeeEducationDto {
  @ApiProperty({
    description: 'The ID of the employee',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @ApiProperty({
    example: 'Trường đại học',
  })
  @IsNotEmpty()
  @IsString()
  school: string;

  @ApiProperty({
    example: 'Cử nhân',
  })
  @IsNotEmpty()
  @IsString()
  degree: string;

  @ApiProperty({
    example: 'Công nghệ thông tin',
  })
  @IsNotEmpty()
  @IsString()
  fieldOfStudy: string;

  @ApiProperty({
    example: 2020,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(2000)
  startYear: number;

  @ApiProperty({
    example: 2024,
  })
  @IsOptional()
  @IsNumber()
  @Min(2000)
  endYear?: number;
}
