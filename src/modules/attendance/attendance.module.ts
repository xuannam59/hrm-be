import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entities/attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
