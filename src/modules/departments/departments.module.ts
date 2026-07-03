import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentEntity } from './entities/department.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DepartmentEntity, EmployeeEntity])],
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule {}
