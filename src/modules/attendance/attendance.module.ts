import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceEntity } from './entities/attendance.entity';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceImportJobsEntity } from './entities/attendance-import-jobs.entity';
import { AttendanceImportLogsEntity } from './entities/attendance-import-logs.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AttendanceImportController } from './attendance-import.controller';
import { AttendanceImportService } from './attendance-import.service';
import { AttendanceImportProgressService } from './attendance-import-progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceEntity,
      AttendanceImportJobsEntity,
      AttendanceImportLogsEntity,
    ]),
    EmployeesModule,
    CloudinaryModule,
  ],
  controllers: [AttendanceController, AttendanceImportController],
  providers: [
    AttendanceService,
    AttendanceImportService,
    AttendanceImportProgressService,
  ],
})
export class AttendanceModule {}
