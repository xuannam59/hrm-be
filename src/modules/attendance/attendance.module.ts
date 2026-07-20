import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from './entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, EmployeeEntity])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
