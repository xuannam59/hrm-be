import { Module } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestEntity } from './entities/leave-request.entity';
import { EmployeeEntity } from '../employees/entities/employee.entity';
import { AttendanceEntity } from '../attendance/entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequestEntity, EmployeeEntity])],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
