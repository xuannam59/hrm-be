import { Module } from '@nestjs/common';
import { EmployeeBenefitService } from './employee-benefit.service';
import { EmployeeBenefitController } from './employee-benefit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeBenefitEntity } from './entities/employee-benefit.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeBenefitEntity, EmployeeEntity])],
  controllers: [EmployeeBenefitController],
  providers: [EmployeeBenefitService],
})
export class EmployeeBenefitModule {}
