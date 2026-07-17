import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EmployeeHistoriesModule } from './modules/employee-histories/employee-histories.module';
import { LeaveRequestsModule } from './modules/leave-requests/leave-requests.module';
import { EmployeeEducationsModule } from './modules/employee-educations/employee-educations.module';
import { EmployeeInsuranceModule } from './modules/employee-insurance/employee-insurance.module';
import { EmployeeBenefitModule } from './modules/employee-benefit/employee-benefit.module';
import { PayrollsModule } from './modules/payrolls/payrolls.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './infrastructure/database/redis.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    UsersModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    EmployeeHistoriesModule,
    LeaveRequestsModule,
    EmployeeEducationsModule,
    EmployeeInsuranceModule,
    EmployeeBenefitModule,
    PayrollsModule,
  ],
})
export class AppModule {}
