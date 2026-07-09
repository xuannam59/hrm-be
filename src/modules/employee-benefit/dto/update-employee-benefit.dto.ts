import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeBenefitDto } from './create-employee-benefit.dto';

export class UpdateEmployeeBenefitDto extends PartialType(
  OmitType(CreateEmployeeBenefitDto, ['employeeId', 'benefitType']),
) {}
