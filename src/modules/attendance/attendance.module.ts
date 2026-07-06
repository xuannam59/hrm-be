import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entities/attendance.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, EmployeeEntity])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
