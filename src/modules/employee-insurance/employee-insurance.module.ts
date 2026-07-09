import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { EmployeeInsuranceController } from './employee-insurance.controller';
import { EmployeeInsuranceService } from './employee-insurance.service';
import { EmployeeInsuranceEntity } from './entities/employee-insurance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeInsuranceEntity, EmployeeEntity]),
  ],
  controllers: [EmployeeInsuranceController],
  providers: [EmployeeInsuranceService],
})
export class EmployeeInsuranceModule {}
