import { Module } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollEntity } from './entities/payroll.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { EmployeeBenefitEntity } from '../employee-benefit/entities/employee-benefit.entity';
import { EmployeeInsuranceEntity } from '../employee-insurance/entities/employee-insurance.entity';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollEntity,
      EmployeeEntity,
      EmployeeBenefitEntity,
      EmployeeInsuranceEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  controllers: [PayrollsController],
  providers: [PayrollsService],
})
export class PayrollsModule {}
