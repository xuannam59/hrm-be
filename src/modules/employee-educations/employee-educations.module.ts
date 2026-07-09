import { Module } from '@nestjs/common';
import { EmployeeEducationsService } from './employee-educations.service';
import { EmployeeEducationsController } from './employee-educations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEducationEntity } from './entities/employee-education.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEducationEntity, EmployeeEntity]),
  ],
  controllers: [EmployeeEducationsController],
  providers: [EmployeeEducationsService],
})
export class EmployeeEducationsModule {}
