import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeEducationDto } from './create-employee-education.dto';

export class UpdateEmployeeEducationDto extends PartialType(
  CreateEmployeeEducationDto,
) {}
