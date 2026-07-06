import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from './entities/employee.entity';
import { DepartmentEntity } from '../departments/entities/department.entity';
import { UserEntity } from '../users/entities/user.entity';
import { EmploymentHistoryEntity } from '../employee-histories/entities/employment-history.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([
      EmployeeEntity,
      DepartmentEntity,
      UserEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
