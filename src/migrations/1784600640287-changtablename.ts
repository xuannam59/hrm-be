import { MigrationInterface, QueryRunner } from 'typeorm';

export class Changtablename1784600640287 implements MigrationInterface {
  name = 'Changtablename1784600640287';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('Attendance', 'attendances');
    await queryRunner.renameTable('Department', 'departments');
    await queryRunner.renameTable('EmployeeBenefit', 'employee_benefits');
    await queryRunner.renameTable('EmployeeEducation', 'employee_educations');
    await queryRunner.renameTable('EmploymentHistory', 'employment_histories');
    await queryRunner.renameTable('EmployeeInsurance', 'employee_insurances');
    await queryRunner.renameTable('Employee', 'employees');
    await queryRunner.renameTable('LeaveRequest', 'leave_requests');
    await queryRunner.renameTable('Payroll', 'payrolls');
    await queryRunner.renameTable('User', 'users');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('users', 'User');
    await queryRunner.renameTable('payrolls', 'Payroll');
    await queryRunner.renameTable('leave_requests', 'LeaveRequest');
    await queryRunner.renameTable('employees', 'Employee');
    await queryRunner.renameTable('employee_insurances', 'EmployeeInsurance');
    await queryRunner.renameTable('employment_histories', 'EmploymentHistory');
    await queryRunner.renameTable('employee_educations', 'EmployeeEducation');
    await queryRunner.renameTable('employee_benefits', 'EmployeeBenefit');
    await queryRunner.renameTable('departments', 'Department');
    await queryRunner.renameTable('attendances', 'Attendance');
  }
}
