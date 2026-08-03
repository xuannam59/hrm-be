import { Module } from '@nestjs/common';
import { EmployeeBenefitService } from './employee-benefit.service';
import { EmployeeBenefitController } from './employee-benefit.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeBenefitEntity } from './entities/employee-benefit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeBenefitEntity])],
  controllers: [EmployeeBenefitController],
  providers: [EmployeeBenefitService],
})
export class EmployeeBenefitModule {}
