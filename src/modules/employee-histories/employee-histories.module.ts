import { Module } from '@nestjs/common';
import { EmployeeHistoriesService } from './employee-histories.service';
import { EmployeeHistoriesController } from './employee-histories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmploymentHistoryEntity } from './entities/employment-history.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmploymentHistoryEntity,
      EmployeeEntity,
      DepartmentEntity,
    ]),
  ],
  controllers: [EmployeeHistoriesController],
  providers: [EmployeeHistoriesService],
})
export class EmployeeHistoriesModule {}
